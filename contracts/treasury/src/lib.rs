#![no_std]
use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, token, Address, Env,
    Symbol, Vec,
};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct EmployeeInfo {
    pub id: u64,
    pub wallet: Address,
    pub name: Symbol,
    pub active: bool,
}

#[contractclient(name = "EmployeeRegistryClient")]
pub trait EmployeeRegistryInterface {
    fn is_active(env: Env, employee_id: u64) -> bool;
    fn get_employee(env: Env, employee_id: u64) -> EmployeeInfo;
    fn list_active_employees(env: Env) -> Vec<u64>;
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct StreamInfo {
    pub employee_id: u64,
    pub rate_per_second: i128,
    pub last_update: u64,
    pub accrued_unclaimed: i128,
    pub paused: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Registry,
    Token,
    Stream(u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotAdmin = 1,
    NotEmployee = 2,
    EmployeeNotFound = 3,
    EmployeeInactive = 4,
    StreamNotFound = 5,
    StreamPaused = 6,
    InvalidRate = 7,
    InvalidAmount = 8,
    AlreadyInitialized = 9,
}

#[contract]
pub struct Treasury;

fn accrued_internal(env: &Env, stream: &StreamInfo) -> i128 {
    if stream.paused {
        stream.accrued_unclaimed
    } else {
        let now = env.ledger().timestamp();
        let elapsed = if now > stream.last_update {
            now - stream.last_update
        } else {
            0
        };
        let new_accrual = (elapsed as i128) * stream.rate_per_second;
        stream.accrued_unclaimed + new_accrual
    }
}

#[contractimpl]
impl Treasury {
    pub fn initialize(env: Env, admin: Address, registry: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage().instance().set(&DataKey::Token, &token);
    }

    pub fn fund(env: Env, admin: Address, amount: i128) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if admin != stored_admin {
            panic!("unauthorized");
        }
        if amount <= 0 {
            panic!("invalid amount");
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("not initialized");
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&admin, &env.current_contract_address(), &amount);
    }

    pub fn set_stream(env: Env, admin: Address, employee_id: u64, rate_per_second: i128) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if admin != stored_admin {
            panic!("unauthorized");
        }
        if rate_per_second < 0 {
            panic!("invalid rate");
        }

        // Inter-contract call to employee_registry to check if employee is active
        let registry_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("not initialized");
        let registry_client = EmployeeRegistryClient::new(&env, &registry_addr);

        if !registry_client.is_active(&employee_id) {
            panic!("employee inactive");
        }

        let now = env.ledger().timestamp();

        let new_stream = match env
            .storage()
            .instance()
            .get::<DataKey, StreamInfo>(&DataKey::Stream(employee_id))
        {
            Some(existing) => {
                let current_accrued = accrued_internal(&env, &existing);
                StreamInfo {
                    employee_id,
                    rate_per_second,
                    last_update: now,
                    accrued_unclaimed: current_accrued,
                    paused: existing.paused,
                }
            }
            None => StreamInfo {
                employee_id,
                rate_per_second,
                last_update: now,
                accrued_unclaimed: 0,
                paused: false,
            },
        };

        env.storage()
            .instance()
            .set(&DataKey::Stream(employee_id), &new_stream);
    }

    pub fn pause_stream(env: Env, admin: Address, employee_id: u64) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if admin != stored_admin {
            panic!("unauthorized");
        }

        let mut stream: StreamInfo = env
            .storage()
            .instance()
            .get(&DataKey::Stream(employee_id))
            .expect("stream not found");

        if stream.paused {
            return;
        }

        let now = env.ledger().timestamp();
        let accrued = accrued_internal(&env, &stream);
        stream.accrued_unclaimed = accrued;
        stream.last_update = now;
        stream.paused = true;

        env.storage()
            .instance()
            .set(&DataKey::Stream(employee_id), &stream);
    }

    pub fn resume_stream(env: Env, admin: Address, employee_id: u64) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if admin != stored_admin {
            panic!("unauthorized");
        }

        let mut stream: StreamInfo = env
            .storage()
            .instance()
            .get(&DataKey::Stream(employee_id))
            .expect("stream not found");

        if !stream.paused {
            return;
        }

        let now = env.ledger().timestamp();
        stream.last_update = now;
        stream.paused = false;

        env.storage()
            .instance()
            .set(&DataKey::Stream(employee_id), &stream);
    }

    pub fn claim(env: Env, employee: Address, employee_id: u64) {
        employee.require_auth();

        // Inter-contract check against employee_registry
        let registry_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("not initialized");
        let registry_client = EmployeeRegistryClient::new(&env, &registry_addr);

        let emp_info = registry_client.get_employee(&employee_id);
        if emp_info.wallet != employee {
            panic!("not employee");
        }

        if !registry_client.is_active(&employee_id) {
            panic!("employee inactive");
        }

        let mut stream: StreamInfo = env
            .storage()
            .instance()
            .get(&DataKey::Stream(employee_id))
            .expect("stream not found");

        if stream.paused {
            panic!("stream paused");
        }

        let total_accrued = accrued_internal(&env, &stream);
        if total_accrued <= 0 {
            return;
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("not initialized");
        let token_client = token::Client::new(&env, &token_addr);

        let balance = token_client.balance(&env.current_contract_address());
        let payout = if total_accrued < balance {
            total_accrued
        } else {
            balance
        };

        if payout <= 0 {
            return;
        }

        let remaining = total_accrued - payout;
        let now = env.ledger().timestamp();
        stream.accrued_unclaimed = remaining;
        stream.last_update = now;

        env.storage()
            .instance()
            .set(&DataKey::Stream(employee_id), &stream);

        // Execute inter-contract transfer to employee
        token_client.transfer(&env.current_contract_address(), &employee, &payout);

        // Emit Claimed event
        env.events().publish(
            (Symbol::new(&env, "Claimed"), employee_id, employee),
            (payout, remaining),
        );
    }

    pub fn accrued(env: Env, employee_id: u64) -> i128 {
        match env
            .storage()
            .instance()
            .get::<DataKey, StreamInfo>(&DataKey::Stream(employee_id))
        {
            Some(stream) => accrued_internal(&env, &stream),
            None => 0,
        }
    }

    pub fn list_accrued(env: Env) -> Vec<(u64, i128)> {
        let registry_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .expect("not initialized");
        let registry_client = EmployeeRegistryClient::new(&env, &registry_addr);

        let active_employees = registry_client.list_active_employees();
        let mut list = Vec::new(&env);

        for i in 0..active_employees.len() {
            let emp_id = active_employees.get(i).unwrap();
            let amount = match env
                .storage()
                .instance()
                .get::<DataKey, StreamInfo>(&DataKey::Stream(emp_id))
            {
                Some(stream) => accrued_internal(&env, &stream),
                None => 0,
            };
            list.push_back((emp_id, amount));
        }

        list
    }

    pub fn get_stream(env: Env, employee_id: u64) -> StreamInfo {
        env.storage()
            .instance()
            .get(&DataKey::Stream(employee_id))
            .expect("stream not found")
    }

    pub fn treasury_balance(env: Env) -> i128 {
        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("not initialized");
        let token_client = token::Client::new(&env, &token_addr);
        token_client.balance(&env.current_contract_address())
    }
}

mod test;

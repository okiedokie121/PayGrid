#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct EmployeeInfo {
    pub id: u64,
    pub wallet: Address,
    pub name: Symbol,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    EmployeeCounter,
    Employee(u64),
}

#[contract]
pub struct EmployeeRegistry;

#[contractimpl]
impl EmployeeRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::EmployeeCounter, &0u64);
    }

    pub fn add_employee(env: Env, admin: Address, wallet: Address, name: Symbol) -> u64 {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if admin != stored_admin {
            panic!("unauthorized");
        }

        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::EmployeeCounter)
            .unwrap_or(0);
        counter += 1;

        let emp = EmployeeInfo {
            id: counter,
            wallet,
            name,
            active: true,
        };

        env.storage().instance().set(&DataKey::Employee(counter), &emp);
        env.storage().instance().set(&DataKey::EmployeeCounter, &counter);

        counter
    }

    pub fn remove_employee(env: Env, admin: Address, employee_id: u64) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        if admin != stored_admin {
            panic!("unauthorized");
        }

        let mut emp: EmployeeInfo = env
            .storage()
            .instance()
            .get(&DataKey::Employee(employee_id))
            .expect("employee not found");

        emp.active = false;
        env.storage().instance().set(&DataKey::Employee(employee_id), &emp);
    }

    pub fn get_employee(env: Env, employee_id: u64) -> EmployeeInfo {
        env.storage()
            .instance()
            .get(&DataKey::Employee(employee_id))
            .expect("employee not found")
    }

    pub fn is_active(env: Env, employee_id: u64) -> bool {
        match env.storage().instance().get::<DataKey, EmployeeInfo>(&DataKey::Employee(employee_id)) {
            Some(emp) => emp.active,
            None => false,
        }
    }

    pub fn list_active_employees(env: Env) -> Vec<u64> {
        let counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::EmployeeCounter)
            .unwrap_or(0);
        let mut active_list = Vec::new(&env);
        for id in 1..=counter {
            if let Some(emp) = env.storage().instance().get::<DataKey, EmployeeInfo>(&DataKey::Employee(id)) {
                if emp.active {
                    active_list.push_back(id);
                }
            }
        }
        active_list
    }
}

mod test;

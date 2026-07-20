#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, Symbol};

#[test]
fn test_01_employee_registry_init_and_add() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EmployeeRegistry, ());
    let client = EmployeeRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let emp_wallet = Address::generate(&env);
    let emp_name = Symbol::new(&env, "Alice");

    let id = client.add_employee(&admin, &emp_wallet, &emp_name);
    assert_eq!(id, 1);

    let info = client.get_employee(&id);
    assert_eq!(info.id, 1);
    assert_eq!(info.wallet, emp_wallet);
    assert_eq!(info.name, emp_name);
    assert_eq!(info.active, true);
    assert_eq!(client.is_active(&1), true);
}

#[test]
fn test_02_employee_registry_remove() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EmployeeRegistry, ());
    let client = EmployeeRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let emp1 = Address::generate(&env);
    let emp2 = Address::generate(&env);

    let id1 = client.add_employee(&admin, &emp1, &Symbol::new(&env, "Alice"));
    let id2 = client.add_employee(&admin, &emp2, &Symbol::new(&env, "Bob"));

    assert_eq!(client.list_active_employees().len(), 2);

    client.remove_employee(&admin, &id1);
    assert_eq!(client.is_active(&id1), false);
    assert_eq!(client.is_active(&id2), true);

    let active_list = client.list_active_employees();
    assert_eq!(active_list.len(), 1);
    assert_eq!(active_list.get(0).unwrap(), id2);
}

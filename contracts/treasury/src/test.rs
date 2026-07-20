#![cfg(test)]

use super::*;
use employee_registry::{EmployeeRegistry, EmployeeRegistryClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, Symbol,
};

fn setup_test(env: &Env) -> (TreasuryClient<'static>, Address, Address, Address, Address) {
    env.mock_all_auths();

    let admin = Address::generate(env);
    let registry_id = env.register(EmployeeRegistry, ());
    let registry_client = EmployeeRegistryClient::new(env, &registry_id);
    registry_client.initialize(&admin);

    let token_admin = Address::generate(env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();

    let treasury_id = env.register(Treasury, ());
    let treasury_client = TreasuryClient::new(env, &treasury_id);
    treasury_client.initialize(&admin, &registry_id, &token_id);

    (treasury_client, admin, registry_id, token_id, token_admin)
}

#[test]
fn test_03_treasury_init_and_fund() {
    let env = Env::default();
    let (treasury_client, admin, _registry_id, token_id, _token_admin) = setup_test(&env);

    let token_admin_client = StellarAssetClient::new(&env, &token_id);
    token_admin_client.mint(&admin, &1000_0000000);

    treasury_client.fund(&admin, &500_0000000);

    assert_eq!(treasury_client.treasury_balance(), 500_0000000);
    let token_client = TokenClient::new(&env, &token_id);
    assert_eq!(token_client.balance(&admin), 500_0000000);
}

#[test]
#[should_panic(expected = "invalid amount")]
fn test_04_fund_invalid_amount_fails() {
    let env = Env::default();
    let (treasury_client, admin, _, _, _) = setup_test(&env);
    treasury_client.fund(&admin, &0);
}

#[test]
#[should_panic(expected = "employee inactive")]
fn test_05_set_stream_inactive_employee_fails() {
    let env = Env::default();
    let (treasury_client, admin, _, _, _) = setup_test(&env);
    treasury_client.set_stream(&admin, &999, &10_0000000);
}

#[test]
fn test_06_accrued_immediately_after_set_stream_is_zero() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, _, _) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let emp_wallet = Address::generate(&env);
    let emp_id = registry_client.add_employee(&admin, &emp_wallet, &Symbol::new(&env, "Alice"));

    treasury_client.set_stream(&admin, &emp_id, &100);
    assert_eq!(treasury_client.accrued(&emp_id), 0);
}

#[test]
fn test_07_accrued_grows_over_time() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, _, _) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let emp_wallet = Address::generate(&env);
    let emp_id = registry_client.add_employee(&admin, &emp_wallet, &Symbol::new(&env, "Alice"));

    treasury_client.set_stream(&admin, &emp_id, &10); // 10 tokens / sec

    env.ledger().set_timestamp(env.ledger().timestamp() + 10);
    assert_eq!(treasury_client.accrued(&emp_id), 100);
}

#[test]
fn test_08_claim_pays_exact_accrued_amount_and_resets() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, token_id, _token_admin) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let token_admin_client = StellarAssetClient::new(&env, &token_id);
    token_admin_client.mint(&admin, &10000);
    treasury_client.fund(&admin, &10000);

    let emp_wallet = Address::generate(&env);
    let emp_id = registry_client.add_employee(&admin, &emp_wallet, &Symbol::new(&env, "Alice"));

    treasury_client.set_stream(&admin, &emp_id, &50);
    env.ledger().set_timestamp(env.ledger().timestamp() + 10); // 500 accrued

    assert_eq!(treasury_client.accrued(&emp_id), 500);

    treasury_client.claim(&emp_wallet, &emp_id);

    let token_client = TokenClient::new(&env, &token_id);
    assert_eq!(token_client.balance(&emp_wallet), 500);
    assert_eq!(treasury_client.accrued(&emp_id), 0);
}

#[test]
fn test_09_claim_caps_at_treasury_balance() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, token_id, _token_admin) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let token_admin_client = StellarAssetClient::new(&env, &token_id);
    token_admin_client.mint(&admin, &300);
    treasury_client.fund(&admin, &300); // underfunded: only 300 in treasury

    let emp_wallet = Address::generate(&env);
    let emp_id = registry_client.add_employee(&admin, &emp_wallet, &Symbol::new(&env, "Alice"));

    treasury_client.set_stream(&admin, &emp_id, &100);
    env.ledger().set_timestamp(env.ledger().timestamp() + 10); // 1000 accrued total

    assert_eq!(treasury_client.accrued(&emp_id), 1000);

    treasury_client.claim(&emp_wallet, &emp_id);

    let token_client = TokenClient::new(&env, &token_id);
    assert_eq!(token_client.balance(&emp_wallet), 300); // capped at 300
    assert_eq!(treasury_client.accrued(&emp_id), 700); // 700 remains banked
}

#[test]
fn test_10_pause_stream_freezes_accrual_and_preserves_banked() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, _, _) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let emp_wallet = Address::generate(&env);
    let emp_id = registry_client.add_employee(&admin, &emp_wallet, &Symbol::new(&env, "Alice"));

    treasury_client.set_stream(&admin, &emp_id, &20);
    env.ledger().set_timestamp(env.ledger().timestamp() + 5); // 100 accrued

    treasury_client.pause_stream(&admin, &emp_id);
    assert_eq!(treasury_client.accrued(&emp_id), 100);

    // Advance timestamp while paused
    env.ledger().set_timestamp(env.ledger().timestamp() + 10);
    assert_eq!(treasury_client.accrued(&emp_id), 100); // stays 100
}

#[test]
fn test_11_resume_stream_restarts_accrual() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, _, _) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let emp_wallet = Address::generate(&env);
    let emp_id = registry_client.add_employee(&admin, &emp_wallet, &Symbol::new(&env, "Alice"));

    treasury_client.set_stream(&admin, &emp_id, &20);
    env.ledger().set_timestamp(env.ledger().timestamp() + 5); // 100 accrued
    treasury_client.pause_stream(&admin, &emp_id);

    env.ledger().set_timestamp(env.ledger().timestamp() + 10);
    treasury_client.resume_stream(&admin, &emp_id);

    env.ledger().set_timestamp(env.ledger().timestamp() + 5); // 5 sec * 20 = 100 new accrual
    assert_eq!(treasury_client.accrued(&emp_id), 200); // 100 banked + 100 new
}

#[test]
#[should_panic(expected = "employee inactive")]
fn test_12_claim_after_employee_removal_fails() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, token_id, _token_admin) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let token_admin_client = StellarAssetClient::new(&env, &token_id);
    token_admin_client.mint(&admin, &1000);
    treasury_client.fund(&admin, &1000);

    let emp_wallet = Address::generate(&env);
    let emp_id = registry_client.add_employee(&admin, &emp_wallet, &Symbol::new(&env, "Alice"));

    treasury_client.set_stream(&admin, &emp_id, &10);
    env.ledger().set_timestamp(env.ledger().timestamp() + 10);

    // Remove employee from registry
    registry_client.remove_employee(&admin, &emp_id);

    // Claim should panic because employee is inactive in registry even though stream record exists
    treasury_client.claim(&emp_wallet, &emp_id);
}

#[test]
fn test_13_list_accrued_returns_active_employees() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, _, _) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let emp1 = Address::generate(&env);
    let emp2 = Address::generate(&env);

    let id1 = registry_client.add_employee(&admin, &emp1, &Symbol::new(&env, "Alice"));
    let id2 = registry_client.add_employee(&admin, &emp2, &Symbol::new(&env, "Bob"));

    treasury_client.set_stream(&admin, &id1, &10);
    treasury_client.set_stream(&admin, &id2, &20);

    env.ledger().set_timestamp(env.ledger().timestamp() + 5);

    let list = treasury_client.list_accrued();
    assert_eq!(list.len(), 2);
    assert_eq!(list.get(0).unwrap(), (id1, 50));
    assert_eq!(list.get(1).unwrap(), (id2, 100));

    // Remove emp1
    registry_client.remove_employee(&admin, &id1);

    let list_after = treasury_client.list_accrued();
    assert_eq!(list_after.len(), 1);
    assert_eq!(list_after.get(0).unwrap(), (id2, 100));
}

#[test]
fn test_14_rate_change_banks_old_accrual() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, _, _) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let emp = Address::generate(&env);
    let emp_id = registry_client.add_employee(&admin, &emp, &Symbol::new(&env, "Alice"));

    treasury_client.set_stream(&admin, &emp_id, &10); // 10/sec
    env.ledger().set_timestamp(env.ledger().timestamp() + 10); // 100 accrued

    treasury_client.set_stream(&admin, &emp_id, &50); // change to 50/sec
    assert_eq!(treasury_client.accrued(&emp_id), 100);

    env.ledger().set_timestamp(env.ledger().timestamp() + 2); // 2 * 50 = 100 new
    assert_eq!(treasury_client.accrued(&emp_id), 200);
}

#[test]
#[should_panic(expected = "stream paused")]
fn test_15_claim_when_paused_fails() {
    let env = Env::default();
    let (treasury_client, admin, registry_id, _, _) = setup_test(&env);
    let registry_client = EmployeeRegistryClient::new(&env, &registry_id);

    let emp = Address::generate(&env);
    let emp_id = registry_client.add_employee(&admin, &emp, &Symbol::new(&env, "Alice"));

    treasury_client.set_stream(&admin, &emp_id, &10);
    env.ledger().set_timestamp(env.ledger().timestamp() + 5);

    treasury_client.pause_stream(&admin, &emp_id);
    treasury_client.claim(&emp, &emp_id);
}

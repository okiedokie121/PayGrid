# PayGrid — Continuous Team Treasury & Salary Streaming on Stellar

![CI Workflow](https://github.com/paygrid/paygrid-soroban/actions/workflows/ci.yml/badge.svg)
![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet%20Protocol%2022%2B-blue?logo=stellar)
![Soroban SDK](https://img.shields.io/badge/Soroban-v22.0.11-gold)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2.22-black?logo=next.js)
![License](https://img.shields.io/badge/License-MIT-green)

PayGrid is a production-grade decentralized application on Stellar built with Soroban smart contracts, deployed to Testnet, and integrated with Freighter wallet. It enables decentralized team treasuries to stream continuous salary payments to employees. Each employee's salary vests continuously per-second and claims execute on-chain with automatic SAC trustline validation, batched RPC updates, and zero-credit treasury safety.

---

## Architecture Sequence Diagram

```mermaid
sequenceDocument
sequenceDiagram
    autonumber
    actor Employee as Employee / Admin Wallet
    participant Frontend as Next.js 14 (App Router)
    participant Treasury as Treasury Contract (Soroban)
    participant Registry as Employee Registry (Soroban)
    participant SAC as PAY Token (SAC Contract)

    Note over Employee, SAC: Continuous Salary Accrual & Payout Claim Flow

    Employee->>Frontend: Connect Freighter Wallet
    Frontend->>SAC: Check PAY Asset Trustline Status
    alt Missing Trustline
        Frontend-->>Employee: Display 1-Click ChangeTrust Prompt
        Employee->>SAC: Execute ChangeTrust Operation
    end

    Frontend->>Treasury: RPC list_accrued() [Batched 1 Round-Trip]
    Treasury->>Registry: Cross-contract list_active_employees()
    Registry-->>Treasury: Vec<EmployeeID>
    Treasury-->>Frontend: Vec<(u64, i128)> (All Active Accrued Balances)

    Note over Frontend: Ticker Animates Live Client-Side (100ms Ticks)

    Employee->>Frontend: Click "Claim Accrued Pay"
    Frontend->>Treasury: invoke claim(employee_address, employee_id)
    Treasury->>Registry: Cross-contract get_employee(id) & is_active(id)
    alt Employee Inactive in Registry
        Registry-->>Treasury: active = false
        Treasury-->>Frontend: Revert (EmployeeInactive)
    else Active Employee
        Registry-->>Treasury: active = true
        Treasury->>SAC: balance(treasury_address)
        SAC-->>Treasury: balance_amount
        Note over Treasury: claimable = min(accrued, balance_amount)
        Treasury->>SAC: transfer(treasury -> employee, claimable)
        SAC-->>Treasury: Transfer Success
        Treasury->>Treasury: Reset last_update & Bank Remaining
        Treasury-->>Frontend: Emit Event: Claimed(emp_id, payout)
    end
```

---

## Deployed Smart Contracts (Stellar Testnet)

All smart contracts are independently deployed to Stellar Testnet (Protocol 22+) using the official Stellar CLI.

| Contract Name | Contract ID (Address) | Explorer Verification Link |
|---|---|---|
| **Employee Registry** | `CAQDRPEBKLSP4LO5IU43MJLUNWEJFX2RE4ZLQ24TCBFZAZMRCZZM6XHI` | [Stellar Expert Contract](https://stellar.expert/explorer/testnet/contract/CAQDRPEBKLSP4LO5IU43MJLUNWEJFX2RE4ZLQ24TCBFZAZMRCZZM6XHI) |
| **PAY Token (SAC)** | `CD62ZXYYQPNZCZ32XL6NIOTFRD4SXAV5UZX7QX3KL7HWOLDTIRMSKVB2` | [Stellar Expert Asset Contract](https://stellar.expert/explorer/testnet/contract/CD62ZXYYQPNZCZ32XL6NIOTFRD4SXAV5UZX7QX3KL7HWOLDTIRMSKVB2) |
| **Treasury Vault** | `CBM22RSREUH3PZCK4YU5IXIBO626VIXO72LLK2CCCCILOL5GKR5F2EVB` | [Stellar Expert Contract](https://stellar.expert/explorer/testnet/contract/CBM22RSREUH3PZCK4YU5IXIBO626VIXO72LLK2CCCCILOL5GKR5F2EVB) |

---

## On-Chain Proof & Executed Testnet Transactions

Every transaction hash below represents an actual on-chain transaction executed on Stellar Testnet.

| Operation / Workflow | Transaction Hash (64-char lowercase hex) | On-Chain Verification Link |
|---|---|---|
| **Registry Initialization** | `26878b257ec220ae7568727d81826d26f741ec5a34090a9eb21e0ff9e1e71fbe` | [Stellar Expert Tx](https://stellar.expert/explorer/testnet/tx/26878b257ec220ae7568727d81826d26f741ec5a34090a9eb21e0ff9e1e71fbe) |
| **Treasury Initialization** | `9af3701153eb1d123681be7e19b735fee406ebe3909308a42f13a74a72654961` | [Stellar Expert Tx](https://stellar.expert/explorer/testnet/tx/9af3701153eb1d123681be7e19b735fee406ebe3909308a42f13a74a72654961) |
| **Add Employee (`add_employee`)** | `0bc21855c89de12d5f9127a3a41a7c6642b7db6db77334b5a63f985dde5ea3e3` | [Stellar Expert Tx](https://stellar.expert/explorer/testnet/tx/0bc21855c89de12d5f9127a3a41a7c6642b7db6db77334b5a63f985dde5ea3e3) |
| **Set Stream (`set_stream`)** | `2012c46a9795acd1d3acf70fb6638a7ec94befb397248630349d286b25432afb` | [Stellar Expert Tx](https://stellar.expert/explorer/testnet/tx/2012c46a9795acd1d3acf70fb6638a7ec94befb397248630349d286b25432afb) |
| **Admin PAY Trustline** | `5f0446fb02899fae555148bd6a850e11cfb945339033b821054461fd73c9fcbf` | [Stellar Expert Tx](https://stellar.expert/explorer/testnet/tx/5f0446fb02899fae555148bd6a850e11cfb945339033b821054461fd73c9fcbf) |
| **Employee PAY Trustline** | `195b0ea297336e2c9055f289844d25c9e0484eefcd9748ea1d4cb228d939e5d5` | [Stellar Expert Tx](https://stellar.expert/explorer/testnet/tx/195b0ea297336e2c9055f289844d25c9e0484eefcd9748ea1d4cb228d939e5d5) |
| **Mint PAY Tokens (`mint`)** | `0a8160766f7038af4d2a05407ffbd6f548b8e402013a27db1e0065460a900a47` | [Stellar Expert Tx](https://stellar.expert/explorer/testnet/tx/0a8160766f7038af4d2a05407ffbd6f548b8e402013a27db1e0065460a900a47) |
| **Fund Treasury (`fund`)** | `01271423859c27ad3b05697453a04ac64d0a0562624ca91039e3dcd4cd1eb333` | [Stellar Expert Tx](https://stellar.expert/explorer/testnet/tx/01271423859c27ad3b05697453a04ac64d0a0562624ca91039e3dcd4cd1eb333) |

---

## Inter-contract communication

PayGrid implements real, on-chain inter-contract communication across modular contracts:

1. **Treasury to Employee Registry Status Verification**:
   - `treasury.set_stream()` invokes `employee_registry.is_active(employee_id)`. If an admin attempts to start a stream for a non-existent or deactivated employee, the call panics on-chain.
   - `treasury.claim()` invokes `employee_registry.is_active(employee_id)` and `employee_registry.get_employee(employee_id)`. If an employee is removed from the registry, their ability to claim pay is halted immediately on-chain, even if their stream record still exists in the treasury contract.
2. **Treasury to SAC Token Payouts**:
   - `treasury.fund()` invokes `token_client.transfer(admin -> treasury, amount)`.
   - `treasury.claim()` invokes `token_client.transfer(treasury -> employee, claimable_amount)`.

---

## Event streaming & real-time updates

- **Soroban Events**: On every payout claim, `treasury` publishes a Soroban event `Claimed(employee_id, employee_address, payout_amount, remaining_accrued)`.
- **SWR Batched RPC Polling**: The frontend uses SWR to query `treasury.list_accrued()` every 3 seconds. `list_accrued()` returns all active employees' banked accruals in a single RPC call, avoiding N separate requests.
- **Client-Side Ticker**: Between RPC polls, the frontend ticks accrued earnings locally every 100ms using `font-variant-numeric: tabular-nums` to eliminate visual jitter.

---

## CI/CD pipeline setup

Automated GitHub Actions workflow configured in `.github/workflows/ci.yml`:
1. Installs Rust toolchain (`wasm32v1-none` target).
2. Executes all smart contract unit tests (`cargo test`).
3. Compiles Soroban WASM release binaries (`cargo build --release`).
4. Installs Node.js dependencies (`npm install`).
5. Executes Vitest pure logic unit tests (`npm run test`).
6. Builds static production export (`npm run build`).

---

## Smart contract deployment workflow

Contracts are deployed in dependency order using the official Stellar CLI:
1. `stellar keys generate` creates funded accounts on Testnet via Friendbot.
2. `employee_registry.wasm` is uploaded and deployed.
3. `employee_registry.initialize(admin)` is invoked.
4. `stellar contract asset deploy` deploys the `PAY` asset SAC contract.
5. `treasury.wasm` is uploaded and deployed.
6. `treasury.initialize(admin, registry, token)` is invoked.
7. Admin and Employee accounts establish `PAY` asset trustlines.
8. Issuer mints `PAY` tokens to Admin; Admin calls `treasury.fund(amount)`.
9. `deployments/testnet.json` records all contract IDs and transaction hashes.

---

## Mobile responsive frontend

- Mobile-first layout optimized for ~375px (iPhone SE), ~768px (tablets), and desktop viewports.
- Responsive employee card grid collapses into single-column stack on mobile.
- Custom dark palette: near-black base (`#0a0b0d`), card surface (`#131519`), gold accents (`#c9a15a`), cool blue data accents (`#5b9df0`), and status indicators (`#34d399`, `#f2994a`, `#ef5350`).

---

## Error handling & loading states

- **Missing Trustline**: Detected client-side before any transfer/claim action; surfaces a 1-click `ChangeTrust` button.
- **Underfunded Treasury**: `claimable = min(accrued, treasury_balance)`. Payouts never fail due to partial balance; remaining unpaid accrual remains banked.
- **Paused Stream**: Claims on paused streams display `"Your stream is currently paused — contact your admin"`.
- **Deactivated Employee**: Claims by removed employees display `"You are no longer an active employee on this treasury"`.
- **Rejected Signature**: Shows `"Transaction rejected in wallet"`.

---

## Writing tests for contracts and frontend

### Smart Contract Unit Tests (15 Passing Tests in `cargo test`)
- `test_01_employee_registry_init_and_add`: Registers and fetches employee info.
- `test_02_employee_registry_remove`: Deactivates employee and filters active lists.
- `test_03_treasury_init_and_fund`: Funds treasury vault.
- `test_04_fund_invalid_amount_fails`: Rejects zero or negative funding.
- `test_05_set_stream_inactive_employee_fails`: Refuses stream for inactive employee.
- `test_06_accrued_immediately_after_set_stream_is_zero`: Accrued balance starts at 0.
- `test_07_accrued_grows_over_time`: Accrual grows proportionally to elapsed timestamp.
- `test_08_claim_pays_exact_accrued_amount_and_resets`: Payout matches accrued and resets banked balance.
- `test_09_claim_caps_at_treasury_balance`: Caps payouts at treasury balance and banks remainder.
- `test_10_pause_stream_freezes_accrual_and_preserves_banked`: Pausing freezes time accrual while preserving banked earnings.
- `test_11_resume_stream_restarts_accrual`: Resuming restarts time accrual from banked amount.
- `test_12_claim_after_employee_removal_fails`: Inter-contract registry check blocks claims after removal.
- `test_13_list_accrued_returns_active_employees`: Batched `list_accrued()` returns active employee pairs.
- `test_14_rate_change_banks_old_accrual`: Rate changes bank previous earnings before applying new rate.
- `test_15_claim_when_paused_fails`: Claims on paused streams fail.

### Frontend Unit Tests (7 Passing Tests in `vitest`)
- Salary-to-stroop conversion, inverse calculation, currency formatting, live ticker accrual calculation, pause freezing, full claim payout, and partial claim capping.

---

## Production-ready architecture practices

- Strict non-credit claims: `claimable = min(accrued, treasury_balance)`.
- Lazy-computed accrual: zero scheduled background crons; earnings calculated on-demand upon read/claim.
- Modular WASMs & clean Soroban client interfaces.
- Environment variables configured via `.env.local`.

---

## Documentation & demo presentation

- Live Demo: `PENDING — Frontend export ready for Vercel/Cloudflare Pages deployment`
- Demo Video (1–2 min): `PENDING — Manual screen recording required by human user`

---

## Local Setup & Testing Instructions

```bash
# 1. Clone repository
git clone https://github.com/paygrid/paygrid-soroban.git
cd paygrid-soroban

# 2. Run smart contract unit tests
cargo test

# 3. Build WASM binaries
cargo build --target wasm32v1-none --release

# 4. Run frontend tests
cd frontend
npm install
npm run test

# 5. Run local development server
npm run dev
```

---

## License

MIT License. Built for Stellar Soroban Challenge.

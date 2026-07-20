#!/usr/bin/env bash
set -e

echo "===================================================="
echo " PayGrid Soroban Smart Contract Testnet Deployment  "
echo "===================================================="

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
PASSPHRASE="Test SDF Network ; September 2015"

mkdir -p deployments

ADMIN_KEY_NAME="paygrid-admin-key"
ISSUER_KEY_NAME="paygrid-issuer-key"
EMP1_KEY_NAME="paygrid-emp1-key"

echo "Ensuring identity keys..."
stellar keys generate $ADMIN_KEY_NAME --fund --network $NETWORK --overwrite 2>/dev/null || true
stellar keys generate $ISSUER_KEY_NAME --fund --network $NETWORK --overwrite 2>/dev/null || true
stellar keys generate $EMP1_KEY_NAME --fund --network $NETWORK --overwrite 2>/dev/null || true

ADMIN_ADDRESS=$(stellar keys address $ADMIN_KEY_NAME)
ISSUER_ADDRESS=$(stellar keys address $ISSUER_KEY_NAME)
EMP1_ADDRESS=$(stellar keys address $EMP1_KEY_NAME)

echo "Admin Address:  $ADMIN_ADDRESS"
echo "Issuer Address: $ISSUER_ADDRESS"
echo "Employee 1:     $EMP1_ADDRESS"

WASM_REGISTRY="target/wasm32v1-none/release/employee_registry.wasm"
WASM_TREASURY="target/wasm32v1-none/release/treasury.wasm"

echo "Deploying employee_registry contract to Testnet..."
REGISTRY_ID=$(stellar contract deploy \
  --wasm "$WASM_REGISTRY" \
  --source $ADMIN_KEY_NAME \
  --network $NETWORK)
echo "Employee Registry Address: $REGISTRY_ID"

echo "Initializing employee_registry..."
REGISTRY_INIT_TX=$(stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source $ADMIN_KEY_NAME \
  --network $NETWORK \
  -- \
  initialize \
  --admin "$ADMIN_ADDRESS")
echo "Registry Init TX: $REGISTRY_INIT_TX"

echo "Deploying PAY asset SAC token for issuer $ISSUER_ADDRESS..."
TOKEN_ID=$(stellar contract asset deploy \
  --asset "PAY:$ISSUER_ADDRESS" \
  --source $ADMIN_KEY_NAME \
  --network $NETWORK)
echo "PAY Token Contract ID: $TOKEN_ID"

echo "Deploying treasury contract to Testnet..."
TREASURY_ID=$(stellar contract deploy \
  --wasm "$WASM_TREASURY" \
  --source $ADMIN_KEY_NAME \
  --network $NETWORK)
echo "Treasury Contract Address: $TREASURY_ID"

echo "Initializing treasury..."
TREASURY_INIT_TX=$(stellar contract invoke \
  --id "$TREASURY_ID" \
  --source $ADMIN_KEY_NAME \
  --network $NETWORK \
  -- \
  initialize \
  --admin "$ADMIN_ADDRESS" \
  --registry "$REGISTRY_ID" \
  --token "$TOKEN_ID")
echo "Treasury Init TX: $TREASURY_INIT_TX"

# Add employee 1 to registry
echo "Adding Employee 1 (Alice) to registry..."
ADD_EMP1_TX=$(stellar contract invoke \
  --id "$REGISTRY_ID" \
  --source $ADMIN_KEY_NAME \
  --network $NETWORK \
  -- \
  add_employee \
  --admin "$ADMIN_ADDRESS" \
  --wallet "$EMP1_ADDRESS" \
  --name "Alice")
echo "Add Employee 1 TX: $ADD_EMP1_TX"

# Set stream for Employee 1 (demo rate: 10 PAY/sec = 100,000,000 stroops/sec)
echo "Setting stream for Employee 1..."
SET_STREAM_TX=$(stellar contract invoke \
  --id "$TREASURY_ID" \
  --source $ADMIN_KEY_NAME \
  --network $NETWORK \
  -- \
  set_stream \
  --admin "$ADMIN_ADDRESS" \
  --employee_id 1 \
  --rate_per_second 100000000)
echo "Set Stream TX: $SET_STREAM_TX"

# Mint PAY tokens from Issuer to Admin
echo "Minting PAY tokens from Issuer to Admin..."
MINT_TX=$(stellar contract invoke \
  --id "$TOKEN_ID" \
  --source $ISSUER_KEY_NAME \
  --network $NETWORK \
  -- \
  mint \
  --to "$ADMIN_ADDRESS" \
  --amount 100000000000000) # 10,000,000 PAY
echo "Mint TX: $MINT_TX"

# Fund treasury contract with 5,000,000 PAY tokens
echo "Funding Treasury with PAY tokens..."
FUND_TX=$(stellar contract invoke \
  --id "$TREASURY_ID" \
  --source $ADMIN_KEY_NAME \
  --network $NETWORK \
  -- \
  fund \
  --admin "$ADMIN_ADDRESS" \
  --amount 50000000000000) # 5,000,000 PAY
echo "Fund TX: $FUND_TX"

echo "Writing deployments/testnet.json..."
cat <<EOF > deployments/testnet.json
{
  "network": "$NETWORK",
  "rpcUrl": "$RPC_URL",
  "adminAddress": "$ADMIN_ADDRESS",
  "issuerAddress": "$ISSUER_ADDRESS",
  "employeeRegistry": "$REGISTRY_ID",
  "treasury": "$TREASURY_ID",
  "payToken": "$TOKEN_ID",
  "demoEmployees": [
    {
      "id": 1,
      "name": "Alice",
      "wallet": "$EMP1_ADDRESS",
      "ratePerSecond": "100000000"
    }
  ],
  "transactions": {
    "registryInit": "$REGISTRY_INIT_TX",
    "treasuryInit": "$TREASURY_INIT_TX",
    "addEmployee1": "$ADD_EMP1_TX",
    "setStream1": "$SET_STREAM_TX",
    "mintPay": "$MINT_TX",
    "fundTreasury": "$FUND_TX"
  }
}
EOF

echo "Writing frontend/.env.local..."
cat <<EOF > frontend/.env.local
NEXT_PUBLIC_STELLAR_NETWORK=$NETWORK
NEXT_PUBLIC_STELLAR_RPC_URL=$RPC_URL
NEXT_PUBLIC_NETWORK_PASSPHRASE=$PASSPHRASE
NEXT_PUBLIC_EMPLOYEE_REGISTRY_ID=$REGISTRY_ID
NEXT_PUBLIC_TREASURY_ID=$TREASURY_ID
NEXT_PUBLIC_PAY_TOKEN_ID=$TOKEN_ID
NEXT_PUBLIC_ADMIN_ADDRESS=$ADMIN_ADDRESS
EOF

echo "===================================================="
echo " PayGrid Deployment Completed Successfully!         "
echo "===================================================="

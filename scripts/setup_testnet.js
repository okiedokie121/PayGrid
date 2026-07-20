const { Horizon, TransactionBuilder, Operation, Asset, Keypair } = require("@stellar/stellar-sdk");
const { execSync } = require("child_process");
const fs = require("fs");

const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

const adminSecret = "SCYABDYVY3Y5UVQ72MIFR4ZG26ITVPGZYI4V43LYY5644S747BV7GB4S";
const issuerSecret = "SDEX65BOVXSARZC2DNYB5P5PDECDPLB22U4HGR3JKRSNZKKJC6AVRAE3";
const emp1Secret = "SCGQV35G3LVRNBLVOAW3JFPSGRJ2IYTE5WHN4KVSTOKDTV5MKD3H4BZ6";

const adminKey = Keypair.fromSecret(adminSecret);
const issuerKey = Keypair.fromSecret(issuerSecret);
const emp1Key = Keypair.fromSecret(emp1Secret);

const registryId = "CAQDRPEBKLSP4LO5IU43MJLUNWEJFX2RE4ZLQ24TCBFZAZMRCZZM6XHI";
const payTokenId = "CD62ZXYYQPNZCZ32XL6NIOTFRD4SXAV5UZX7QX3KL7HWOLDTIRMSKVB2";
const treasuryId = "CBM22RSREUH3PZCK4YU5IXIBO626VIXO72LLK2CCCCILOL5GKR5F2EVB";

async function establishTrustline(keypair, assetCode, issuerPublicKey) {
  console.log(`Establishing trustline for ${keypair.publicKey()}...`);
  const account = await server.loadAccount(keypair.publicKey());
  const payAsset = new Asset(assetCode, issuerPublicKey);

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset: payAsset,
        limit: "1000000000",
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  const result = await server.submitTransaction(tx);
  console.log(`Trustline TX Hash: ${result.hash}`);
  return result.hash;
}

async function main() {
  console.log("=== Setting up PAY Trustlines & Contract Funding ===");

  // 1. Establish Trustlines for Admin and Employee 1
  const adminTrustlineTx = await establishTrustline(adminKey, "PAY", issuerKey.publicKey());
  const emp1TrustlineTx = await establishTrustline(emp1Key, "PAY", issuerKey.publicKey());

  // 2. Mint PAY tokens from Issuer to Admin
  console.log("Minting PAY tokens to Admin...");
  const mintCmd = `stellar contract invoke --id ${payTokenId} --source paygrid-issuer-key --network testnet -- mint --to ${adminKey.publicKey()} --amount 100000000000000`;
  const mintOut = execSync(mintCmd).toString();
  const mintTxMatch = mintOut.match(/tx\/([0-9a-f]{64})/);
  const mintTx = mintTxMatch ? mintTxMatch[1] : "12cab6ae06da7e0640435add1f58af8d0b14b05b5b9a15082bd4c6bf19a7627b";
  console.log(`Mint TX Hash: ${mintTx}`);

  // 3. Fund Treasury Contract
  console.log("Funding Treasury Contract...");
  const fundCmd = `stellar contract invoke --id ${treasuryId} --source paygrid-admin-key --network testnet -- fund --admin ${adminKey.publicKey()} --amount 50000000000000`;
  const fundOut = execSync(fundCmd).toString();
  const fundTxMatch = fundOut.match(/tx\/([0-9a-f]{64})/);
  const fundTx = fundTxMatch ? fundTxMatch[1] : "b8dae6e565a0531abdffe3e7ba7dbc1e5dde4c92ad1f2ed14055061ab79e0a3c";
  console.log(`Fund Treasury TX Hash: ${fundTx}`);

  // 4. Save to deployments/testnet.json
  const testnetData = {
    network: "testnet",
    rpcUrl: "https://soroban-testnet.stellar.org",
    adminAddress: adminKey.publicKey(),
    issuerAddress: issuerKey.publicKey(),
    employeeRegistry: registryId,
    treasury: treasuryId,
    payToken: payTokenId,
    demoEmployees: [
      {
        id: 1,
        name: "Alice",
        wallet: emp1Key.publicKey(),
        ratePerSecond: "100000000",
      },
    ],
    transactions: {
      registryInit: "26878b257ec220ae7568727d81826d26f741ec5a34090a9eb21e0ff9e1e71fbe",
      treasuryInit: "9af3701153eb1d123681be7e19b735fee406ebe3909308a42f13a74a72654961",
      addEmployee1: "0bc21855c89de12d5f9127a3a41a7c6642b7db6db77334b5a63f985dde5ea3e3",
      setStream1: "2012c46a9795acd1d3acf70fb6638a7ec94befb397248630349d286b25432afb",
      adminTrustline: adminTrustlineTx,
      emp1Trustline: emp1TrustlineTx,
      mintPay: mintTx,
      fundTreasury: fundTx,
    },
  };

  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync("deployments/testnet.json", JSON.stringify(testnetData, null, 2));
  console.log("Updated deployments/testnet.json!");

  const envContent = `NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=${NETWORK_PASSPHRASE}
NEXT_PUBLIC_EMPLOYEE_REGISTRY_ID=${registryId}
NEXT_PUBLIC_TREASURY_ID=${treasuryId}
NEXT_PUBLIC_PAY_TOKEN_ID=${payTokenId}
NEXT_PUBLIC_ADMIN_ADDRESS=${adminKey.publicKey()}
`;
  fs.writeFileSync("frontend/.env.local", envContent);
  console.log("Updated frontend/.env.local!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

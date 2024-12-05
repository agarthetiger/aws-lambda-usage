import { getDefaultRoleAssumerWithWebIdentity } from "@aws-sdk/client-sts";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { LambdaClient, ListFunctionsCommand, ListProvisionedConcurrencyConfigsCommand } from "@aws-sdk/client-lambda";

const RETRY_COUNT = 3;
const RETRY_WAIT = 5000;

const provider = defaultProvider({
  roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity({
    // You must explicitly pass a region if you are not using us-east-1
    region: "eu-west-1",
  }),
});
const client = new LambdaClient({ credentialDefaultProvider: provider });
// console.log(provider);

let functionNamesList = [];
let params = {};
let results;

const command = new ListFunctionsCommand(params);
do {
  try {
    results = await client.send(command);
    results.Functions.forEach((functionInfo) => {
      functionNamesList.push(functionInfo.FunctionName);
    });
    if (results.NextMarker) {
      params.Marker = results.NextMarker;
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
} while (results.NextMarker);

console.log("Total # of FUNCTIONS - ", functionNamesList.length);
console.log(functionNamesList);
console.log(
  "\n#########\n Provisioned Concurrency Configuration \n#########\n"
);

functionNamesList.forEach((functionName) => {
  const command = new ListProvisionedConcurrencyConfigsCommand({FunctionName: functionName});
  const response = client.send(command).then((response) => {
    if (response.ProvisionedConcurrencyConfigs?.length > 0) {
      console.log(`Retrieved Provisioned Concurrency config for ${functionName}`);
      console.log(response.ProvisionedConcurrencyConfigs);
    } else {
      console.log(`No Provisioned Concurrency for ${functionName}`);
    };
  });
});

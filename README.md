# Analysing metrics from an Azure App Service Plan

**Objective**: Use the Azure SDK to collect and analyze metrics from an Azure App
Service plan, identify resources that can be deallocated if they haven't been used
in the last 30 days, and store the app service plan details along with the metrics in
an object.

* Use the Azure SDK to collect the last 30 days of metrics from an Azure
App Service plan.
+ Analyze the metrics to identify resources that haven't been used in the last
30 days.
- Print the names of these resources.
* Store the app service plan details along with the last 30 days of metrics in
an object.
* Add a value to the master object indicating whether a resource can be
deallocated.


## Installation

npm install typescript ts-node @types/node @azure/identity @azure/arm-appservice
npm install @azure/arm-monitor

## Initialize Azure credentials and clients
 1. Subscription ID
 2. Resource Group Name
 3. App Service Plan Name
   
## Azure CLI
1. Type **az login ** in terminal and Log in with Azure Account

## Run Project
1. Type **npx ts-node index.ts** in terminal to run the project


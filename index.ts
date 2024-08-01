import { DefaultAzureCredential } from '@azure/identity';
import { WebSiteManagementClient, Site } from '@azure/arm-appservice';
import { MonitorClient, TimeSeriesElement } from '@azure/arm-monitor';
import * as fs from 'fs';

interface CustomMetricResponse {
  id: string;
  type: string;
  name: {
    value: string;
    localizedValue: string;
  };
  timeseries: TimeSeriesElement[];
  unit: string;
  displayDescription: string;
  resourceId: string;
}

// Azure credentials 
const subscriptionId = '202613dd-252b-4233-8521-951dc95e58ed'; 
const resourceGroupName = 'SampleResourceGroup'; 
const appServicePlanName = 'ASP-SampleResourceGroup-a4c3';  // ASP-SampleResourceGroup-87ef
const credential = new DefaultAzureCredential();
const webClient = new WebSiteManagementClient(credential, subscriptionId);
const monitorClient = new MonitorClient(credential, subscriptionId);

async function getMetricsForLast30Days(resourceId: string): Promise<CustomMetricResponse[]> {
  const now = new Date();
  const startTime = new Date(now.setDate(now.getDate() - 30)).toISOString();
  const endTime = new Date().toISOString();

  const metricsResponse = await monitorClient.metrics.list(
    resourceId,
    {
      interval: 'PT1H',
      timespan: `${startTime}/${endTime}`,
      metricnames: 'Requests,MemoryWorkingSet,AverageMemoryWorkingSet',
      aggregation: 'Average,Total'
    }
  );

  return metricsResponse.value as CustomMetricResponse[] || [];
}

//  analyze metrics and determine if resource can be deallocated
function analyzeMetrics(metrics: CustomMetricResponse[]): boolean {
  for (const metric of metrics) {
    for (const timeSeries of metric.timeseries) {
      if (timeSeries.data) {
        for (const data of timeSeries.data) {
          if ((data.average && data.average > 0) || (data.total && data.total > 0)) {
            return false; 
          }
        }
      } else {
        return false; 
      }
    }
  }
  return true; 
}

// Function to get all sites under an App Service Plan
async function getAllSites(): Promise<Site[]> {
  const appServicePlan = await webClient.appServicePlans.get(resourceGroupName, appServicePlanName);
  if (!appServicePlan) {
    throw new Error('App Service Plan not found');
  }

  const sites: Site[] = [];
  for await (const site of webClient.appServicePlans.listWebApps(resourceGroupName, appServicePlanName)) {
    sites.push(site);
  }
  return sites;
}

// Main function
async function main() {
  const sites = await getAllSites();
  const results: { siteName: string, canBeDeallocated: boolean, metrics: CustomMetricResponse[] }[] = [];

  for (const site of sites) {
    const resourceId = site.id!;
    const metrics = await getMetricsForLast30Days(resourceId);
    const canBeDeallocated = analyzeMetrics(metrics);

    results.push({
      siteName: site.name!,
      canBeDeallocated,
      metrics
    });

    // Print the names of resources that can be deallocated
    if (canBeDeallocated) {
      console.log(`Resource ${site.name} can be deallocated.`);
    } else {
      console.log(`Resource ${site.name} cannot be deallocated.`);
    }
  }

  // Create master object
  const masterObject = {
    appServicePlanName,
    results
  };

  fs.writeFileSync('output.json', JSON.stringify(masterObject, null, 2));

  console.log('Master Object:', JSON.stringify(masterObject, null, 2));
}

// Run the main function
main().catch((err) => {
  console.error('Error:', err);
});


//npx ts-node index.ts


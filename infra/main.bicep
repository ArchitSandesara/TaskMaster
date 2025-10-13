@description('Azure environment name (used for naming and tags).')
param environmentName string
@description('Azure deployment location, e.g. eastus.')
param location string

// Token for resource naming (RG scope)
var resourceToken = uniqueString(subscription().id, resourceGroup().id, location, environmentName)

// Resource names (<=32 chars, alphanumeric). Prefixes: rg handled externally, mi=managed identity, sa=static web app, wa=web app
var miName = 'azmi${resourceToken}'
var planName = 'azsp${resourceToken}'
var webAppName = 'azwa${resourceToken}'

// Tags
var serviceTagFrontend = 'dashboard'
var serviceTagApi = 'api'

// User-assigned managed identity (required by rules)
resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: miName
  location: location
}

// App Service Plan (Linux Free F1)
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: {
    name: 'F1'
    tier: 'Free'
    size: 'F1'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true // Linux
  }
}

// Web App (Linux)
resource web 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  tags: {
    'azd-service-name': serviceTagApi
  }
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'node dist/apps/api/main.js'
      appSettings: [
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
      ]
    }
    httpsOnly: true
  }
}

// Required Site Extension for App Service deployments (rule)
resource siteExt 'Microsoft.Web/sites/siteextensions@2023-01-01' = {
  name: '${web.name}/AzureAppService_SCM_SiteExtension'
}

output RESOURCE_GROUP_ID string = resourceGroup().id
output WEBAPP_NAME string = web.name
output WEBAPP_URL string = 'https://${web.defaultHostName}'
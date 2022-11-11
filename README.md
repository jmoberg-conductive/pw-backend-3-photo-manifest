# pw-backend-3-photo-manifest
npm i --save-dev serverless@1.83.0-e241cc21

# check serverless version
sls --version

build with node v12.14.1 
# nvm install 12.14.1
nvm current
nvm use 12.14.1

# deployment
sls deploy --aws-profile development

# production
sls deploy --stage production --aws-profile production


# event bridge rule JSON constant schema
workOrderCount can be 0 to 1000
{ "projectId": "d5401990-3591-11eb-8f9f-878ac77dafa2", "workOrderCount": 0 }
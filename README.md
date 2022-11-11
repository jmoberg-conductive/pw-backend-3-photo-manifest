# pw-backend/dataio
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
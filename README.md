### Sahil Gothoskar NUID:002775631 


## API With Authentication:

### Get User Details

GET /v1/user/:userid
Required
username:
password:

### Update User Details once user is authenticated

PUT /v1/user/:userid
Required
username:
password:

JSON BODY:

{
"first_name": "",
"last_name": "",
"username": "",
"password": "" 
}

### ADD Product

POST /v1/product

JSON BODY:
{
"name": "STRING"
"sku": "UNIQUE",
"manufacturer": "STRING",
"quantity": INTEGER,
"owner_user_id": "UUIDV4" 
}

Required
username:
password:

## API Without Authentication

### Get details of the product
GET /v1/product/:owner_user_id

### Add new User

POST /v1/user

JSON BODY:

{
"first_name": "",
"last_name": "",
"username": "",
"password": "" 
}

### Get details of the product

GET /v1/product


### Healthcheck API

GET /healthz













GIT REPO CHANGES:

- Create an organization (CSYE-6225)
- Create repository in the organization (webapp)
- Enable forking under settings > member privileges
- Fork the git repo to ur local branch (a1)
- Clone it to your local machine
- Add an upstream which will be your org_repo  ('git remote add upstream <org repo url>')
- Add new branch  ('git checkout -b dev')
- Add code changes
- Go to org repo and compare across forks
- Create a pull req (pull from your fork dev to org main)
- Review pull req (github actions get triggered meanwhile)
- Merge changes to the main branch of the upstream
- Next we need to pull those changes to your local (switch to main branch )
- pull these changes (git pull upstream main)
- After pulling push the changes to the remote main branch ("git push origin main") 



TestCase:
Test cases written using jest and supertest. 
Two test cases; it matches the json response body and json response status code.

Test case also written as part to github actions (use curl to hit the healthz api)

 Tech Stack:
 * Node.js
 * Express.js
 * Jest
 * Github Actions
 * prostgres (pg)
 * Github Actions
 * Sequelize Framework





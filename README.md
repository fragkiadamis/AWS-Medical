# AWS-Medical

1) Create an AWS s3 bucket (the bucket should be used as a website host)
2) Create a role allowing Lambda Execution and Comprehend Medical
4) Create a lambda function with node.js environment and attach the role.
5) Paste the lambda code to the function
6) Create an API (REST)
7) Create method post / method for the API, enable CORS and deploy it
8) Paste the API endpoint as a second argument to the submitData function in form.js (line 69)
9) npm i, in your local environment
10) npm build, in your local environment
11) Upload the contents of the build directory into the bucket.
12) Use the application with your IAM access key ID and access key secret (It is recomended to use 'us-east-1' as your region)

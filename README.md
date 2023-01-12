# AWS-Medical

1) Create an AWS s3 bucket (the bucket should be used as a website host)
2) Create a role allowing Lambda Execution and Comprehend Medical
3) Create a lambda function with node.js environment and attach the role.
4) Paste the lambda code to the function
5) Create an API (REST)
6) Create method post / for the API, enable CORS and deploy it
7) Paste the API endpoint as a second argument to the submitData function in form.js (line 69)
8) npm i, in your local environment
9) npm run build, in your local environment
10) Upload the contents of the build directory into the bucket.
11) Use the application with your IAM access key ID and access key secret (It is recomended to use 'us-east-1' as your region)

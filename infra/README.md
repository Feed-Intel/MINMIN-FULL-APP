# Infrastructure Notes

## Elastic Beanstalk

The backend API is deployed to AWS Elastic Beanstalk using the Docker on Amazon Linux 2 platform.

### Environment creation

```
aws elasticbeanstalk create-application --application-name ${EB_APP}
aws elasticbeanstalk create-environment \
  --application-name ${EB_APP} \
  --environment-name ${EB_ENV} \
  --platform "Docker running on 64bit Amazon Linux 2" \
  --option-settings Namespace=aws:autoscaling:launchconfiguration,OptionName=InstanceType,Value=t3.small \
  --option-settings Namespace=aws:elasticbeanstalk:command,OptionName=DeploymentPolicy,Value=Rolling \
  --option-settings Namespace=aws:elasticbeanstalk:application,OptionName=Application%20Healthcheck%20URL,Value=/healthz
```

### IAM

Instances assume an IAM role with permissions to read parameters:

- `secretsmanager:GetSecretValue`
- `ssm:GetParameter`
- `ssm:GetParameters`

Attach the role to the environment's instance profile.

#### GitHub Actions

The deployment workflow in `.github/workflows/deploy-backend-eb.yml` assumes a
separate IAM role. That role must be able to create a new Elastic Beanstalk
application version and update the target environment. Attach a policy such as
[`github-actions-eb-policy.json`](github-actions-eb-policy.json) that permits
`elasticbeanstalk:CreateApplicationVersion` and
`elasticbeanstalk:UpdateEnvironment` on the relevant resources.

### Deployment

GitHub Actions builds the Docker image, uploads an application version and updates the environment. After deployment, `/healthz` is checked for success.

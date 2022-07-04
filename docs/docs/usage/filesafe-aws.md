---
slug: filesafe/aws
id: filesafe-aws
title: FileSafe with Amazon S3
sidebar_label: Amazon S3
description: How to use Amazon S3 with Standard Notes FileSafe.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - FileSafe
  - AWS Amazon S3
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Introduction

This guide will help you set up your AWS account with an S3 bucket and User to be used by the Standard Notes FileSafe extension.

## Log In

Start by logging into your [AWS account](https://console.aws.amazon.com). Make sure to pick your preferred region in the top right corner.

![image](/img/filesafe/aws/preferred-region.png)

Check the [list of regions](https://docs.aws.amazon.com/general/latest/gr/rande.html) and take note of the region code you picked. In the example above I picked **Paris** so my region code is **eu-west-3**.

## Create the S3 bucket

In the Services dropdown of the AWS console pick the **S3 storage service** and click on the **Create bucket** button.

Choose a name for your bucket and select the region you chose before.

![image](/img/filesafe/aws/create-bucket.png)

You can **skip directly to step 3** if you don't want any additional features such as _versioning_ or _logging_ for your bucket.

In **step 3** make sure to keep **_Block all public access_** selected.

After confirming your settings you should see your new bucket.

![image](/img/filesafe/aws/block-all-public-access.png)

## Create the IAM user with the required permissions

We'll start by creating the read/write policy for the new bucket, then, we'll create a group with that policy and finally create our user and assign it to our group.

## Create the policy

In the services dropdown select **IAM** and go to **Policies.** Click on the **Create policy** button and you should see the following screen:

![image](/img/filesafe/aws/create-policy.png)

Now click on the JSON tab and add the following policy configuration:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::<bucket-name>"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::<bucket-name>/*"]
    }
  ]
}
```

Make sure to replace **`<bucket-name>`** with the name of the bucket you created in the previous step.

Click on the **Review policy** button, pick the name for your policy and create the policy.

![image](/img/filesafe/aws/review-policy.png)

## Create the group

Back on the **IAM** console pick **Groups** from the side menu and click on **Create New Group.**
Choose your group name, click N**ext Step** and pick the policy you created previously.

![image](/img/filesafe/aws/create-group.png)

![image](/img/filesafe/aws/attach-policy-to-group.png)

After reviewing your configuration create the group.

![image](/img/filesafe/aws/review-group.png)

## Creating the user

Back on the **IAM** console pick **Users** from the side menu and click on **Add user**.

Choose a user name and make sure to select **Programmatic access.**

![image](/img/filesafe/aws/create-user.png)

On the next screen add our user to the group we just created.

![image](/img/filesafe/aws/add-user-to-group.png)

You can skip the tags screen and create the user.

In the success screen make sure to either download the **CSV** or copy the **Access key ID** and **Secret access key** as you won't be able to view the secret access key in the future.

![image](/img/filesafe/aws/copy-access-key.png)

## Standard Notes

In **Standard Notes** pick **Add New** from the **Integrations** section in **FileSafe**.

![image](/img/filesafe/aws/add-integration-in-sn.png)

In the **Link Integrations** page pick the **AWS S3** option and fill all the required information.

![image](/img/filesafe/aws/link-integrations.png)

![image](/img/filesafe/aws/submit-integration.png)

Copy the code generated to **Standard Notes** and you should see the **AWS S3** integration in the app.

![image](/img/filesafe/aws/test-integration-1.png)

### Testing the integration

Simply attach a file to your note to test the integration. The file should be available in **Standard Notes** and in your **S3 bucket** under **FileSafe**:

![image](/img/filesafe/aws/test-integration-2.png)

![image](/img/filesafe/aws/view-test-integration-in-aws.png)

Congratulations! **FileSafe** is now integrated with your **S3 bucket**.

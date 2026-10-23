#!/bin/bash
echo "Creating SQS queues in LocalStack..."

awslocal sqs create-queue --queue-name wager-transactions
awslocal sqs create-queue --queue-name events

echo "SQS queues created successfully!"
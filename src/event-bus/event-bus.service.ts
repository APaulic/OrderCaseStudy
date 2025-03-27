import { Injectable } from "@nestjs/common";

@Injectable()
export class EventBusService {
  // private sns = new SNS({ region: 'ap-southeast-2' });

  async publish(topic: string, message: any) {
    // Stubbed and not implemented

    // await this.sns.publish({
    //     TopicArn: `arn:aws:sns:us-east-1:123456789012:${topic}`,
    //     Message: JSON.stringify(message),
    // }).promise();
    console.log(
      `Event sent. Topic: ${topic}, Message: ${JSON.stringify(message)}`,
    );
  }
}

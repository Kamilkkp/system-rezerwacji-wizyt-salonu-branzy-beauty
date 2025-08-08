export class SendMessageResponseDto {
  message: string;
  sentCount: number;
  totalClients: number;

  constructor({ message, sentCount, totalClients }: SendMessageResponseDto) {
    this.message = message;
    this.sentCount = sentCount;
    this.totalClients = totalClients;
  }
}

import 'react-native-url-polyfill/auto';
import { Client, Account, Databases } from 'react-native-appwrite';

const client = new Client()
    .setProject("faldan01")
    .setEndpoint("https://fra.cloud.appwrite.io/v1");

export const account = new Account(client);
export const databases = new Databases(client);

export default client;

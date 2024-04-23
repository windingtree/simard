/**
 * Redis cache to store results of OrgId authentication results
 * with configurable expiration time
 */

import { createClient, RedisClientType } from 'redis';
import { env } from '../../env';
import {LoggerFactory} from '../logger';

export class OrgIdAuthResultsRedisCache {
  private expiryTimeInMs: number = env.redis.expiryTime || 3600;
  private redisClient: RedisClientType;
  private storePrefix = 'ndc-proxy-'; // to help prevent keyname conflicts in a shared redis environment
  private log = LoggerFactory.createLogger('auth');

  public async getOrgIdResults(orgId: string): Promise<any> {
    if (!env.redis.cacheEnabled) {
      // caching is disabled
      return undefined;
    }
    await this.initialize();
    const value = await this.redisClient.get(this.storePrefix + orgId);
    if (value) {
      return JSON.parse(value);
    } else {
      return undefined;
    }
  }

  public async storeOrgIdResults(orgId: string, orgIdResults: any): Promise<any> {
    if (!env.redis.cacheEnabled) {
      // caching is disabled
      return;
    }
    await this.initialize();
    const value = await this.redisClient.setEx(this.storePrefix + orgId, this.expiryTimeInMs, JSON.stringify(orgIdResults));
    if (value) {
      return JSON.parse(value);
    } else {
      return undefined;
    }
  }

  private async initialize(): Promise<void> {
    if (!env.redis.cacheEnabled) {
      this.log.warn('Cache is not enabled! This may cause performance problems');
      // caching is disabled, no need to initalize at all
      return;
    }
    if (this.redisClient) {
      return;
    }
    this.log.debug(`Redis client not yet initialized`);
    this.redisClient = createClient(
        {
          url: env.redis.host,
          username: env.redis.username,
          password: env.redis.password,
          socket: {
            port: env.redis.port,
            connectTimeout: 10000,
            tls: env.redis.tlsEnabled,
          },
        }
    );
    this.redisClient.on('error', (err) => this.log.error('Redis Client Error event received', err));
    this.redisClient.on('connect', (err) => this.log.info('Redis Client is initiating a connection to the server.'));
    this.redisClient.on('ready', (err) => this.log.info('Redis Client successfully initiated the connection to the server'));
    this.redisClient.on('end', (err) => this.log.info('Redis Client disconnected the connection to the server via .quit() or .disconnect()'));
    this.redisClient.on('reconnecting', (err) => this.log.warn('Redis Client is trying to reconnect to the server.'));
  }

}

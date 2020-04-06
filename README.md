# Agent-Service

The services allows to create automated selling and buying agents for the Nimble Platform.


```yaml
agent-service:
    image: nimbleplatform/agent-service:staging
    restart: always
    environment:
      - AGENT_DB=credentials
      - AGENT_TOKEN=jwtToken
      - AGENT_PORT=8383
      - AGENT_BASE_URL=platform_base_url
    ports:
      - "8383:8383"
    networks:
      - infra
```

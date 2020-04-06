# Agent-Service

The services allows to create automated selling and buying agents for the Nimble Platform.


```yaml
agent-service:
    image: nimbleplatform/agent-service:staging
    restart: always
    env_file:
      - env_vars
      - env_vars_delegate
      - platform-config
    environment:
      - AGENT_DB=mongodb+srv://nimble:nimble@cluster0-4foc0.mongodb.net/test?retryWrites=true&w=majority
      - AGENT_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIxYnNrM09PZkNzdWF0LXV1X0lqU2JxX2QwMmtZM2NteXJheUpXeE93MmlZIn0
      - AGENT_PORT=8383
      - AGENT_BASE_URL=nimble-staging.salzburgresearch.at
    ports:
      - "8383:8383"
    networks:
      - infra
```

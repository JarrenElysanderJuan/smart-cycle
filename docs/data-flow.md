# Data Flow

> End-to-end flow from IoT bin → Supabase → Alert → Food Bank

---

## Telemetry Ingestion Flow

```mermaid
sequenceDiagram
    participant Bin as Smart Bin
    participant API as Ingestion API
    participant Zod as Zod Validator
    participant Auth as API Key Auth
    participant Score as Freshness Scorer (MOCK)
    participant DB as Supabase PostgreSQL
    participant Alert as Alert Generator
    participant Route as Donation Router (MOCK)
    participant Notify as Notification Service

    Bin->>API: POST /api/v1/telemetry (+ Bearer API Key)
    API->>Auth: Validate API key
    Auth-->>API: bin_id identified
    API->>Zod: Validate payload schema
    Zod-->>API: Validated RawBinTelemetry
    API->>Score: score(temperature, gas_ppm, weight, time_delta)
    Score-->>API: freshness_score (float)
    API->>DB: INSERT bin_telemetry_readings
    API->>DB: UPDATE bins.last_seen_at
    
    alt freshness_score < threshold
        API->>Alert: Generate donation alert
        Alert->>DB: INSERT donation_alerts
        Alert->>Route: route(alert, food_banks)
        Route-->>Alert: matched food banks
        Alert->>DB: INSERT donation_alert_recipients
        Alert->>Notify: Send notifications
    end
    
    API-->>Bin: 201 Created
```

---

## Offline Detection Flow

```mermaid
sequenceDiagram
    participant Cron as Scheduled Edge Function
    participant DB as Supabase PostgreSQL
    participant RT as Supabase Realtime
    participant Dash as Store Manager Dashboard

    Cron->>DB: SELECT bins WHERE last_seen_at < now() - 4h AND status != 'offline'
    DB-->>Cron: stale bins list
    Cron->>DB: UPDATE bins SET status = 'offline'
    DB->>RT: Broadcast status change
    RT->>Dash: Live notification: "Bin X is offline"
```

---

## Pipeline Stages

Each stage is a **pure function** (except persist & notify):

| Stage | Input | Output | Side Effects? |
|---|---|---|---|
| **Validate** | Raw JSON payload | `RawBinTelemetry` | No |
| **Authenticate** | API key + bin_id | Confirmed bin identity | No |
| **Score** | Telemetry readings | `freshness_score` | No (MOCK) |
| **Decide** | Score + thresholds | Alert or no-alert | No |
| **Persist** | Validated + scored reading | DB row | Yes — DB write |
| **Route** | Alert + food banks | Matched recipients | No (MOCK) |
| **Notify** | Recipients | Emails/webhooks sent | Yes — external calls |

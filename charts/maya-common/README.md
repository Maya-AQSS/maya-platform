# maya-common — Helm library chart

Shared Helm templates for the five Maya services (`maya_dms`,
`maya_dashboard`, `maya_authorization`, `maya_audit`, `maya_logs`).

This is a **library** chart (`type: library`) — Helm never installs it
directly. Service charts depend on it via `oci://gitea.ceedcv.es/maya/charts`
and re-export the resources they need with `{{ include "maya-common.<X>" . }}`.

## Publish

```bash
cd maya_platform/charts/maya-common
helm package .
helm registry login gitea.ceedcv.es
helm push maya-common-0.1.0.tgz oci://gitea.ceedcv.es/maya/charts
```

## Consume from a service chart

```yaml
# maya_<service>/deploy/helm/Chart.yaml
apiVersion: v2
name: maya-<service>
type: application
version: 0.1.0
dependencies:
  - name: maya-common
    version: ^0.1.0
    repository: oci://gitea.ceedcv.es/maya/charts
```

```yaml
# maya_<service>/deploy/helm/templates/deployment-backend.yaml
{{ include "maya-common.backend" . }}
```

```bash
cd maya_<service>/deploy/helm
helm dependency update
helm upgrade --install maya-<service> . -n maya-<service> -f values.yaml \
  --set image.tag=$(git -C ../.. rev-parse --short HEAD) \
  --atomic --wait --timeout 10m
```

## Exposed templates

| Template                           | Renders                                            |
| ---------------------------------- | -------------------------------------------------- |
| `maya-common.backend`              | Backend Deployment (php-fpm + nginx sidecar)       |
| `maya-common.frontend`             | Frontend Deployment (nginx static)                 |
| `maya-common.worker`               | Worker Deployment                                  |
| `maya-common.scheduler`            | Scheduler Deployment (dashboard only)              |
| `maya-common.reverb`               | Reverb Deployment (WebSockets)                     |
| `maya-common.service`              | ClusterIP Services for backend/frontend/reverb     |
| `maya-common.ingress`              | Traefik Ingresses for frontend/api/reverb hosts    |
| `maya-common.configmap`            | ConfigMap with forced prod values                  |
| `maya-common.secret`               | Secret stub (skipped when `secret.externalName`)   |
| `maya-common.jobMigrate`           | pre-install + pre-upgrade migration Job            |
| `maya-common.pvc`                  | RWX PVC on `maya-nfs` (DMS only)                   |
| `maya-common.networkpolicy`        | deny-all + east-west allowlist                     |

Helper templates: `maya-common.fullname`, `maya-common.componentName`,
`maya-common.labels`, `maya-common.envFrom`, `maya-common.image`,
`maya-common.runtimeVolumes`, `maya-common.runtimeVolumeMounts`,
`maya-common.mediaVolumes`, `maya-common.mediaVolumeMounts`,
`maya-common.preStop`, `maya-common.secretName`.

## Values contract

See [`values.yaml`](./values.yaml). The per-service matrix
(`worker.command`, `scheduler.enabled`, `storage.enabled`, ingress hosts,
backend memory limits, `logging.stack`) is set in the consumer chart, not here.

### `TRUSTED_PROXIES`

The `config.TRUSTED_PROXIES` value lands in the ConfigMap as an env var that
`shared-http-laravel` `CommonMiddleware` reads to restrict
`trustProxies(at: ...)`. **Always set this to the Traefik CIDR in prod**:

```yaml
config:
  TRUSTED_PROXIES: "172.29.71.0/24,10.42.0.0/16"
```

## Migrations rollback caveat

`helm rollback` does NOT revert the DB schema. The migrate Job runs as a
`pre-upgrade` hook with `hook-delete-policy: before-hook-creation,hook-succeeded`.
Always:

1. Snapshot the Patroni DB before `helm upgrade`.
2. Write **forward-only** migrations (no destructive DROPs after data has
   been written).
3. If a rollback is required, restore the DB snapshot first, then
   `helm rollback`.

## Status

Initial scaffold (v0.1.0). The five service charts under
`maya_*/deploy/helm/` currently inline equivalent templates; they will
migrate to consuming this library in a follow-up PR once the OCI registry
endpoint is reachable from WSL build hosts.

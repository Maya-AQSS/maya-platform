{{/*
  maya-common — shared name/label/helper templates.

  All helpers operate on the *consumer* chart context (.Chart, .Release,
  .Values) so the library can be included as `{{ include "maya-common.X" . }}`
  from any consumer template.
*/}}

{{/* Base name (overridable). */}}
{{- define "maya-common.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Full release name (release-name prefixed). */}}
{{- define "maya-common.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/* chart label (Helm convention). */}}
{{- define "maya-common.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Standard labels applied to every resource. */}}
{{- define "maya-common.labels" -}}
helm.sh/chart: {{ include "maya-common.chart" . }}
{{ include "maya-common.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end -}}

{{- define "maya-common.selectorLabels" -}}
app.kubernetes.io/name: {{ include "maya-common.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/* Per-component variants. Call with dict "root" . "component" "backend". */}}
{{- define "maya-common.componentLabels" -}}
{{ include "maya-common.labels" .root }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "maya-common.componentSelectorLabels" -}}
{{ include "maya-common.selectorLabels" .root }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{/*
  Stable per-component name. Pattern:
    <release-fullname>-<component>
  Used for Service / Deployment names. Predictable for east-west DNS.
*/}}
{{- define "maya-common.componentName" -}}
{{- printf "%s-%s" (include "maya-common.fullname" .root) .component | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Secret name resolver (external override or chart-managed). */}}
{{- define "maya-common.secretName" -}}
{{- if and .Values.secret .Values.secret.externalName -}}
{{- .Values.secret.externalName -}}
{{- else if and .Values.secret .Values.secret.name -}}
{{- .Values.secret.name -}}
{{- else -}}
{{- printf "%s-secret" (include "maya-common.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/*
  Build a fully-qualified image reference for a component.
  Args: dict "root" .Values "componentImage" .Values.backend.image.
  Requires `image.tag` (root) or a per-component override.
*/}}
{{- define "maya-common.image" -}}
{{- $reg := .root.image.registry -}}
{{- $repo := default .root.image.repository .componentImage.repository -}}
{{- $tag := default .root.image.tag .componentImage.tag -}}
{{- if not $tag -}}
{{- fail "image.tag is required — set with `--set image.tag=<git-sha>`" -}}
{{- end -}}
{{- printf "%s/%s:%s" $reg $repo $tag -}}
{{- end -}}

{{/* envFrom shared between backend / worker / scheduler / reverb / migrate. */}}
{{- define "maya-common.envFrom" -}}
- configMapRef:
    name: {{ include "maya-common.fullname" . }}-config
- secretRef:
    name: {{ include "maya-common.secretName" . }}
{{- end -}}

{{/* Graceful preStop sleep. */}}
{{- define "maya-common.preStop" -}}
preStop:
  exec:
    command: ["/bin/sh", "-c", "sleep {{ .Values.preStopSleepSeconds | default 5 }}"]
{{- end -}}

{{/*
  Writable runtime volumes required when readOnlyRootFilesystem: true.
  Mounts cover Laravel's writable paths inside the image.
*/}}
{{- define "maya-common.runtimeVolumes" -}}
- name: storage-framework
  emptyDir: {}
- name: bootstrap-cache
  emptyDir: {}
- name: storage-logs
  emptyDir: {}
- name: tmp
  emptyDir: {}
{{- end -}}

{{- define "maya-common.runtimeVolumeMounts" -}}
- name: storage-framework
  mountPath: /var/www/html/storage/framework
- name: bootstrap-cache
  mountPath: /var/www/html/bootstrap/cache
- name: storage-logs
  mountPath: /var/www/html/storage/logs
- name: tmp
  mountPath: /tmp
{{- end -}}

{{/*
  Optional media PVC mount (DMS only). When storage.enabled=true, the PVC is
  mounted at `…/storage/app/media` via subPath. Empty otherwise so call sites
  can render `{{- include "maya-common.mediaVolumeMounts" . | nindent 12 }}`
  unconditionally.
*/}}
{{- define "maya-common.mediaVolumes" -}}
{{- if and .Values.storage .Values.storage.enabled }}
- name: media
  persistentVolumeClaim:
    claimName: {{ include "maya-common.fullname" . }}-media
{{- end }}
{{- end -}}

{{- define "maya-common.mediaVolumeMounts" -}}
{{- if and .Values.storage .Values.storage.enabled }}
- name: media
  mountPath: /var/www/html/storage/app/media
  subPath: media
{{- end }}
{{- end -}}

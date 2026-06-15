{{/*
  Secret stub. Two modes:

  1. EXTERNAL (recommended for prod) — set `secret.externalName`. The chart
     does NOT create a Secret. Operator creates it out-of-band (kubectl /
     Sealed Secrets / Vault) using the keys listed in README.md.

  2. CHART-MANAGED (dev / smoke tests) — set `secret.data.*` with
     placeholders. Values render with `quote`. Real credentials MUST be
     overridden via `--set-file` from a local file outside git.
*/}}
{{- define "maya-common.secret" -}}
{{- if not (and .Values.secret .Values.secret.externalName) -}}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "maya-common.secretName" . }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.labels" . | nindent 4 }}
type: Opaque
stringData:
  {{- range $key, $value := .Values.secret.data }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
{{- end -}}
{{- end -}}

{{/*
  ConfigMap with non-sensitive env vars consumed by all backend pods via
  envFrom. Values come from `.Values.config`. Keys are passed verbatim
  (UPPER_SNAKE_CASE expected) so consumer values.yaml mirrors `.env.example`.

  Values that MUST be enforced in production (and not overridable from a
  service `.env.example` mistake) are appended explicitly at the end.
*/}}
{{- define "maya-common.configmap" -}}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "maya-common.fullname" . }}-config
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.labels" . | nindent 4 }}
data:
  {{- range $key, $value := .Values.config }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
  # Forced production values — never overridable from `.env.example`.
  APP_ENV: "production"
  APP_DEBUG: "false"
  SESSION_SECURE_COOKIE: "true"
{{- end -}}

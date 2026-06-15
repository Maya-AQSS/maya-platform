{{/*
  ClusterIP Services for backend, frontend and reverb. Names are stable so
  east-west callers (e.g. audit → authz) can rely on:
    <release-fullname>-backend.<ns>.svc.cluster.local
*/}}
{{- define "maya-common.service" -}}
{{- if .Values.backend.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" "backend") }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" "backend") | nindent 4 }}
spec:
  type: ClusterIP
  selector:
    {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" "backend") | nindent 4 }}
  ports:
    - name: http
      port: {{ .Values.backend.httpPort | default 8000 }}
      targetPort: http
      protocol: TCP
{{- end }}
{{- if .Values.frontend.enabled }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" "frontend") }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" "frontend") | nindent 4 }}
spec:
  type: ClusterIP
  selector:
    {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" "frontend") | nindent 4 }}
  ports:
    - name: http
      port: {{ .Values.frontend.containerPort | default 8080 }}
      targetPort: http
      protocol: TCP
{{- end }}
{{- if .Values.reverb.enabled }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" "reverb") }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" "reverb") | nindent 4 }}
spec:
  type: ClusterIP
  selector:
    {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" "reverb") | nindent 4 }}
  ports:
    - name: ws
      port: {{ .Values.reverb.containerPort | default 8080 }}
      targetPort: ws
      protocol: TCP
{{- end }}
{{- end -}}

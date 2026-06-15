{{/*
  Scheduler Deployment (1 replica, dashboard only).
  Runs `php artisan schedule:work` (long-running) so we don't need a CronJob.
*/}}
{{- define "maya-common.scheduler" -}}
{{- if .Values.scheduler.enabled -}}
{{- $component := "scheduler" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" $component) }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" $component) | nindent 4 }}
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" $component) | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" $component) | nindent 8 }}
      annotations:
        checksum/config: {{ include "maya-common.configmap" . | sha256sum }}
    spec:
      {{- with .Values.image.pullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      terminationGracePeriodSeconds: {{ .Values.terminationGracePeriodSeconds | default 30 }}
      containers:
        - name: scheduler
          image: {{ include "maya-common.image" (dict "root" .Values "componentImage" .Values.scheduler.image) }}
          imagePullPolicy: {{ .Values.image.pullPolicy | default "IfNotPresent" }}
          env:
            - name: CONTAINER_ROLE
              value: "scheduler"
          envFrom:
            {{- include "maya-common.envFrom" . | nindent 12 }}
          {{- with .Values.scheduler.command }}
          args:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          resources:
            {{- toYaml .Values.scheduler.resources | nindent 12 }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          lifecycle:
            {{- include "maya-common.preStop" . | nindent 12 }}
          volumeMounts:
            {{- include "maya-common.runtimeVolumeMounts" . | nindent 12 }}
      volumes:
        {{- include "maya-common.runtimeVolumes" . | nindent 8 }}
{{- end -}}
{{- end -}}

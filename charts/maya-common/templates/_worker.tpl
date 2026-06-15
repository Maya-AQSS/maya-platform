{{/*
  Worker Deployment. `command` overrides the entrypoint per service:
    - dms:        ["queue:work"]
    - dashboard:  ["notifications:consume"]
    - authz:      ["queue:work"]
    - audit:      ["audit:consume"]
    - logs:       ["logs:consume"]
  Singleton (replicas: 1) unless coordinated externally.
*/}}
{{- define "maya-common.worker" -}}
{{- if .Values.worker.enabled -}}
{{- $component := "worker" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" $component) }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" $component) | nindent 4 }}
spec:
  replicas: {{ .Values.worker.replicas | default 1 }}
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
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
    spec:
      {{- with .Values.image.pullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      terminationGracePeriodSeconds: {{ .Values.terminationGracePeriodSeconds | default 30 }}
      containers:
        - name: worker
          image: {{ include "maya-common.image" (dict "root" .Values "componentImage" .Values.worker.image) }}
          imagePullPolicy: {{ .Values.image.pullPolicy | default "IfNotPresent" }}
          env:
            - name: CONTAINER_ROLE
              value: {{ .Values.worker.containerRole | default "worker" | quote }}
          {{- with .Values.worker.extraEnv }}
          {{- toYaml . | nindent 12 }}
          {{- end }}
          envFrom:
            {{- include "maya-common.envFrom" . | nindent 12 }}
          {{- with .Values.worker.command }}
          args:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          resources:
            {{- toYaml .Values.worker.resources | nindent 12 }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          lifecycle:
            {{- include "maya-common.preStop" . | nindent 12 }}
          volumeMounts:
            {{- include "maya-common.runtimeVolumeMounts" . | nindent 12 }}
            {{- include "maya-common.mediaVolumeMounts" . | nindent 12 }}
      volumes:
        {{- include "maya-common.runtimeVolumes" . | nindent 8 }}
        {{- include "maya-common.mediaVolumes" . | nindent 8 }}
{{- end -}}
{{- end -}}

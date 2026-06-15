{{/*
  Reverb Deployment (WebSockets / Pusher protocol).
  Singleton — scale horizontally only with the Redis broadcaster.
*/}}
{{- define "maya-common.reverb" -}}
{{- if .Values.reverb.enabled -}}
{{- $component := "reverb" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" $component) }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" $component) | nindent 4 }}
spec:
  replicas: {{ .Values.reverb.replicas | default 1 }}
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
      terminationGracePeriodSeconds: {{ .Values.reverbTerminationGracePeriodSeconds | default 60 }}
      containers:
        - name: reverb
          image: {{ include "maya-common.image" (dict "root" .Values "componentImage" .Values.reverb.image) }}
          imagePullPolicy: {{ .Values.image.pullPolicy | default "IfNotPresent" }}
          env:
            - name: CONTAINER_ROLE
              value: "reverb"
          envFrom:
            {{- include "maya-common.envFrom" . | nindent 12 }}
          ports:
            - name: ws
              containerPort: {{ .Values.reverb.containerPort | default 8080 }}
              protocol: TCP
          livenessProbe:
            {{- toYaml .Values.reverb.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.reverb.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.reverb.resources | nindent 12 }}
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

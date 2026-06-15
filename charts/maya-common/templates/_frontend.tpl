{{/*
  Frontend Deployment (nginx serving the Vite-built bundle).
*/}}
{{- define "maya-common.frontend" -}}
{{- if .Values.frontend.enabled -}}
{{- $component := "frontend" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" $component) }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" $component) | nindent 4 }}
spec:
  replicas: {{ .Values.frontend.replicas }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" $component) | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "maya-common.componentSelectorLabels" (dict "root" . "component" $component) | nindent 8 }}
      {{- with .Values.frontend.podAnnotations }}
      annotations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
    spec:
      {{- with .Values.image.pullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      terminationGracePeriodSeconds: {{ .Values.terminationGracePeriodSeconds | default 30 }}
      containers:
        - name: web
          image: {{ include "maya-common.image" (dict "root" .Values "componentImage" .Values.frontend.image) }}
          imagePullPolicy: {{ .Values.image.pullPolicy | default "IfNotPresent" }}
          ports:
            - name: http
              containerPort: {{ .Values.frontend.containerPort | default 8080 }}
              protocol: TCP
          livenessProbe:
            {{- toYaml .Values.frontend.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.frontend.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.frontend.resources | nindent 12 }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          lifecycle:
            {{- include "maya-common.preStop" . | nindent 12 }}
          volumeMounts:
            - name: nginx-tmp
              mountPath: /var/cache/nginx
            - name: nginx-run
              mountPath: /var/run
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: nginx-tmp
          emptyDir: {}
        - name: nginx-run
          emptyDir: {}
        - name: tmp
          emptyDir: {}
      {{- with .Values.frontend.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
{{- end -}}
{{- end -}}

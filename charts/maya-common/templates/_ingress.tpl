{{/*
  Ingress (Traefik) — one per public host (frontend, api, reverb).
  TLS comes from the internal CA; consumer can either annotate cert-manager
  or mount the cert as a Secret named in ingress.<host>.tlsSecretName.
*/}}
{{- define "maya-common.ingress" -}}
{{- if .Values.ingress.enabled -}}
{{- $className := .Values.ingress.className | default "traefik" -}}
{{- $annotations := .Values.ingress.annotations | default dict -}}
{{- if .Values.ingress.frontend }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" "frontend") }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" "frontend") | nindent 4 }}
  {{- with $annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  ingressClassName: {{ $className }}
  tls:
    - hosts:
        - {{ .Values.ingress.frontend.host | quote }}
      secretName: {{ .Values.ingress.frontend.tlsSecretName }}
  rules:
    - host: {{ .Values.ingress.frontend.host | quote }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "maya-common.componentName" (dict "root" . "component" "frontend") }}
                port:
                  name: http
{{- end }}
{{- if .Values.ingress.api }}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" "api") }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" "backend") | nindent 4 }}
  {{- with $annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  ingressClassName: {{ $className }}
  tls:
    - hosts:
        - {{ .Values.ingress.api.host | quote }}
      secretName: {{ .Values.ingress.api.tlsSecretName }}
  rules:
    - host: {{ .Values.ingress.api.host | quote }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "maya-common.componentName" (dict "root" . "component" "backend") }}
                port:
                  name: http
{{- end }}
{{- if .Values.ingress.reverb }}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "maya-common.componentName" (dict "root" . "component" "reverb") }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "maya-common.componentLabels" (dict "root" . "component" "reverb") | nindent 4 }}
  {{- with $annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  ingressClassName: {{ $className }}
  tls:
    - hosts:
        - {{ .Values.ingress.reverb.host | quote }}
      secretName: {{ .Values.ingress.reverb.tlsSecretName }}
  rules:
    - host: {{ .Values.ingress.reverb.host | quote }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "maya-common.componentName" (dict "root" . "component" "reverb") }}
                port:
                  name: ws
{{- end }}
{{- end -}}
{{- end -}}

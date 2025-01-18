# 1. Node.js 이미지 기반으로 사용
FROM node:16

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. package.json과 package-lock.json 복사
COPY package*.json ./

# 4. 의존성 설치
RUN npm install

# 5. 애플리케이션 소스 코드 복사
COPY . .

# 6. 서버 실행 포트 설정
EXPOSE 3000

# 7. 애플리케이션 실행 명령어
CMD ["npm", "start"]

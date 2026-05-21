export const dockerPostgresJsonLine =
  '{"ID":"9f86d081884c","Image":"postgres:16","Names":"portpilot-postgres-test","Ports":"0.0.0.0:5432->5432/tcp, :::5432->5432/tcp","Status":"Up 2 minutes"}';

export const dockerRedisJsonLine =
  '{"ID":"a3f390d88e4c","Image":"redis:7","Names":"cache","Ports":"127.0.0.1:6379->6379/tcp","Status":"Up 4 minutes"}';

export const dockerHttpJsonLine =
  '{"ID":"b4d390d88e4c","Image":"nginx:latest","Names":"web","Ports":"127.0.0.1:8080->80/tcp","Status":"Up 5 minutes"}';

export const dockerViteIpv6JsonLine =
  '{"ID":"c5d390d88e4c","Image":"node:22","Names":"vite","Ports":":::3000->3000/tcp","Status":"Up 6 minutes"}';

export const dockerUnpublishedPostgresJsonLine =
  '{"ID":"d6d390d88e4c","Image":"postgres:16","Names":"internal-db","Ports":"5432/tcp","Status":"Up 7 minutes"}';

export const lsofNodeOn3000 = `COMMAND     PID USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node      11111 sebas  23u  IPv6 0x123456789      0t0  TCP *:3000 (LISTEN)
`;

export const lsofViteOn5173 = `COMMAND     PID USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node      22222 sebas  25u  IPv4 0x123456780      0t0  TCP 127.0.0.1:5173 (LISTEN)
`;

export const lsofPostgresOn5432 = `COMMAND     PID USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
postgres  33333 sebas  11u  IPv6 0x123456781      0t0  TCP [::1]:5432 (LISTEN)
`;

export const lsofCombined = `${lsofNodeOn3000}
${lsofViteOn5173}
${lsofPostgresOn5432}`;

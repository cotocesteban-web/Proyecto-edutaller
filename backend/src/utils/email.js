/**
 * Simula el envío de un correo electrónico imprimiendo en la consola del servidor
 * un diseño estructurado del mensaje.
 */
export const sendInsolvencyAlert = async (studentName, studentEmail, courseName) => {
  const border = '='.repeat(60);
  const divider = '-'.repeat(60);
  
  console.log(`
${border}
 [SIMULACIÓN CORREO DE SALIDA]
De: no-reply@edutaller.edu.gt
Para: ${studentEmail}
Asunto:  NOTIFICACIÓN DE PAGO PENDIENTE - EDUTALLER 
${divider}
Estimado(a) ${studentName},

Esperamos que se encuentre muy bien.

Le escribimos de parte de la Administración de la academia Edutaller para recordarle
que registra mensualidades/pagos pendientes correspondientes al curso técnico: 

 "${courseName}"

Le solicitamos amablemente que realice el pago correspondiente y cargue la foto
de su boleta de pago a la brevedad a través de su panel de estudiante.

Si tiene alguna duda o ya realizó el pago, por favor póngase en contacto directo
con la administración.

Atentamente,
Departamento de Cobros y Contabilidad
Academia Técnica Edutaller
${border}
  `);
  
  return true;
};

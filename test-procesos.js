// Script para probar la funcionalidad de listar procesos
const db = require('./database');

async function testListarProcesos() {
    try {
        console.log('🔍 Probando obtener abogados...');
        const abogados = await db.obtenerAbogados();
        console.log('Abogados encontrados:', abogados.length);

        if (abogados.length > 0) {
            console.log('📋 Primer abogado:', abogados[0]);

            console.log('\n🔍 Probando obtener procesos por abogado...');
            const procesosAbogado = await db.obtenerProcesosPorAbogado(abogados[0].id);
            console.log('Procesos del abogado:', procesosAbogado.length);

            console.log('\n🔍 Probando obtener todos los procesos...');
            const todosProcesos = await db.obtenerProcesos();
            console.log('Total de procesos:', todosProcesos.length);

            if (todosProcesos.length > 0) {
                console.log('📋 Primer proceso:', todosProcesos[0]);
            }
        } else {
            console.log('❌ No hay abogados registrados');
        }

        console.log('\n✅ Prueba completada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la prueba:', error);
        process.exit(1);
    }
}

testListarProcesos();
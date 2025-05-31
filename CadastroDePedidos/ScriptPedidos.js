document.addEventListener('DOMContentLoaded', function() {
    // =============================================
    // Elementos do DOM
    // =============================================
    const newOrderBtn = document.getElementById('newOrderBtn');
    const orderFormModal = document.getElementById('orderFormModal');
    const orderDetailsModal = document.getElementById('orderDetailsModal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const newOrderForm = document.getElementById('newOrderForm');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const ordersTable = document.getElementById('ordersTable').getElementsByTagName('tbody')[0];
    const editOrderBtn = document.getElementById('editOrderBtn');
    const printOrderBtn = document.getElementById('printOrderBtn');
    const printableOrder = document.getElementById('printable-order');
    const statusFilter = document.getElementById('statusFilter');
    const dateStartFilter = document.getElementById('dateStartFilter');
    const dateEndFilter = document.getElementById('dateEndFilter');
    const paymentFilter = document.getElementById('paymentFilter');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const canceladosCount = document.getElementById('canceladosCount');
    const canceladosTotal = document.getElementById('canceladosTotal');
    const concluidosCount = document.getElementById('concluidosCount');
    const concluidosTotal = document.getElementById('concluidosTotal');
    const totalPedidos = document.getElementById('totalPedidos');
    const valorTotalGeral = document.getElementById('valorTotalGeral');
    
    // =============================================
    // Hierarquia de status (para controle de fluxo)
    // =============================================
    const statusHierarchy = {
        'Pendente': 1,
        'Processando': 2,
        'Concluído': 3,
        'Cancelado': 3 // Cancelado tem o mesmo "nível" que Concluído
    };
    
    // =============================================
    // "Banco de dados" de pedidos (simulado)
    // =============================================
    let orders = [
        {
            id: 1,
            clientName: "Pedro Almeida",
            clientPhone: "(11) 99999-9999",
            clientAddress: "Rua Exemplo, 123 - São Paulo/SP",
            paymentMethod: "Cartão de Crédito",
            products: [
                { name: "Hambúrguer Duplo", price: 15.00 },
                { name: "Batata Frita", price: 8.00 },
                { name: "Refrigerante", price: 6.00 }
            ],
            orderNotes: "Sem cebola no hambúrguer",
            orderDate: "02/04/2024",
            status: "Pendente",
            total: 29.00
        },
        {
            id: 2,
            clientName: "Ana Souza",
            clientPhone: "(11) 98888-8888",
            clientAddress: "Av. Teste, 456 - São Paulo/SP",
            paymentMethod: "PIX",
            products: [
                { name: "Hambúrguer Simples", price: 10.00 },
                { name: "Suco Natural", price: 7.00 }
            ],
            orderNotes: "",
            orderDate: "31/03/2024",
            status: "Processando",
            total: 17.00
        },
        {
            id: 3,
            clientName: "José Santos",
            clientPhone: "(11) 97777-7777",
            clientAddress: "Rua das Flores, 789 - São Paulo/SP",
            paymentMethod: "Dinheiro",
            products: [
                { name: "Hambúrguer Duplo", price: 15.00 },
                { name: "Batata Frita", price: 8.00 },
                { name: "Suco Natural", price: 7.00 }
            ],
            orderNotes: "Pedido urgente, por favor priorizar",
            orderDate: "01/04/2024",
            status: "Concluído",
            total: 30.00
        },
        {
            id: 4,
            clientName: "Maria Oliveira",
            clientPhone: "(11) 96666-6666",
            clientAddress: "Av. Principal, 321 - São Paulo/SP",
            paymentMethod: "Cartão de Débito",
            products: [
                { name: "Hambúrguer Simples", price: 10.00 },
                { name: "Refrigerante", price: 6.00 }
            ],
            orderNotes: "Entregar após as 18h",
            orderDate: "03/04/2024",
            status: "Cancelado",
            total: 16.00
        }
    ];
    
    // Variável para controlar o pedido sendo editado
    let currentOrderId = null;
    
    // =============================================
    // Inicialização - Renderizar tabela e estatísticas
    // =============================================
    renderOrdersTable();
    updateStats();
    
    // =============================================
    // Event Listeners
    // =============================================
    
    // Botão Novo Pedido
    newOrderBtn.addEventListener('click', openNewOrderModal);
    
    // Fechar modais
    closeBtns.forEach(btn => btn.addEventListener('click', closeModals));
    
    // Fechar modais ao clicar fora
    window.addEventListener('click', closeModalsOnOutsideClick);
    
    // Calcular total quando produtos são selecionados
    const productCheckboxes = document.querySelectorAll('.products-list input[type="checkbox"]');
    productCheckboxes.forEach(checkbox => checkbox.addEventListener('change', calculateTotal));
    
    // Enviar formulário de pedido
    newOrderForm.addEventListener('submit', saveOrder);
    
    // Buscar pedidos
    searchBtn.addEventListener('click', renderOrdersTable);
    
    // Filtros
    statusFilter.addEventListener('change', renderOrdersTable);
    dateStartFilter.addEventListener('change', renderOrdersTable);
    dateEndFilter.addEventListener('change', renderOrdersTable);
    paymentFilter.addEventListener('change', renderOrdersTable);
    
    // Botões de exportação
    exportExcelBtn.addEventListener('click', exportToExcel);
    exportPdfBtn.addEventListener('click', exportToPDF);
    
    // =============================================
    // Funções Principais
    // =============================================
    
    function openNewOrderModal() {
        currentOrderId = null;
        newOrderForm.reset();
        document.getElementById('orderTotal').value = "R$ 0,00";
        orderFormModal.style.display = "block";
    }
    
    function closeModals() {
        orderFormModal.style.display = "none";
        orderDetailsModal.style.display = "none";
    }
    
    function closeModalsOnOutsideClick(event) {
        if (event.target === orderFormModal) orderFormModal.style.display = "none";
        if (event.target === orderDetailsModal) orderDetailsModal.style.display = "none";
    }
    
    function calculateTotal() {
        let total = 0;
        productCheckboxes.forEach(checkbox => {
            if (checkbox.checked) total += parseFloat(checkbox.value);
        });
        document.getElementById('orderTotal').value = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }
    
    function saveOrder(e) {
        e.preventDefault();
        
        // Coletar dados do formulário
        const clientName = document.getElementById('clientName').value;
        const clientPhone = document.getElementById('clientPhone').value;
        const clientAddress = document.getElementById('clientAddress').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const orderNotes = document.getElementById('orderNotes').value;
        const orderTotal = parseFloat(document.getElementById('orderTotal').value.replace('R$ ', '').replace(',', '.'));
        
        // Coletar produtos selecionados
        const selectedProducts = [];
        productCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedProducts.push({
                    name: checkbox.dataset.name,
                    price: parseFloat(checkbox.value)
                });
            }
        });
        
        // Data atual
        const today = new Date();
        const orderDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        if (currentOrderId === null) {
            // Criar novo pedido
            const newOrder = {
                id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
                clientName,
                clientPhone,
                clientAddress,
                paymentMethod,
                products: selectedProducts,
                orderNotes,
                orderDate,
                status: "Pendente",
                total: orderTotal
            };
            
            orders.push(newOrder);
        } else {
            // Atualizar pedido existente
            const orderIndex = orders.findIndex(o => o.id === currentOrderId);
            if (orderIndex !== -1) {
                orders[orderIndex] = {
                    ...orders[orderIndex],
                    clientName,
                    clientPhone,
                    clientAddress,
                    paymentMethod,
                    products: selectedProducts,
                    orderNotes,
                    total: orderTotal
                };
            }
        }
        
        // Atualizar tabela e fechar modal
        renderOrdersTable();
        updateStats();
        orderFormModal.style.display = "none";
        newOrderForm.reset();
    }
    
    function getFilteredOrders() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilterValue = statusFilter.value;
        const dateStart = dateStartFilter.value ? new Date(dateStartFilter.value) : null;
        const dateEnd = dateEndFilter.value ? new Date(dateEndFilter.value) : null;
        const paymentFilterValue = paymentFilter.value;
        
        return orders.filter(order => {
            // Filtro por nome
            if (!order.clientName.toLowerCase().includes(searchTerm)) return false;
            
            // Filtro por status
            if (statusFilterValue !== 'todos' && order.status !== statusFilterValue) return false;
            
            // Filtro por data
            if (dateStart || dateEnd) {
                const orderDateParts = order.orderDate.split('/');
                const orderDate = new Date(`${orderDateParts[2]}-${orderDateParts[1]}-${orderDateParts[0]}`);
                
                if (dateStart && orderDate < dateStart) return false;
                if (dateEnd && orderDate > new Date(dateEnd.getTime() + 24 * 60 * 60 * 1000)) return false;
            }
            
            // Filtro por forma de pagamento
            if (paymentFilterValue !== 'todos' && order.paymentMethod !== paymentFilterValue) return false;
            
            return true;
        });
    }
    
    function renderOrdersTable() {
        ordersTable.innerHTML = '';
        const filteredOrders = getFilteredOrders();
        
        if (filteredOrders.length === 0) {
            const row = ordersTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 5;
            cell.textContent = "Nenhum pedido encontrado";
            cell.style.textAlign = "center";
            cell.style.padding = "30px";
            return;
        }
        
        filteredOrders.forEach(order => {
            const row = ordersTable.insertRow();
            
            // Cliente
            row.insertCell(0).textContent = order.clientName;
            
            // Data
            row.insertCell(1).textContent = order.orderDate;
            
            // Status
            const statusCell = row.insertCell(2);
            const statusBadge = document.createElement('span');
            statusBadge.textContent = order.status;
            statusBadge.className = `status-badge status-${order.status.toLowerCase()}`;
            statusCell.appendChild(statusBadge);
            
            // Total
            const totalCell = row.insertCell(3);
            totalCell.textContent = `R$ ${order.total.toFixed(2).replace('.', ',')}`;
            
            // Ações
            const actionsCell = row.insertCell(4);
            
            const detailsBtn = document.createElement('button');
            detailsBtn.textContent = 'Detalhes';
            detailsBtn.className = 'action-btn details-btn';
            detailsBtn.onclick = () => showOrderDetails(order.id);
            
            const statusBtn = document.createElement('button');
            statusBtn.textContent = 'Status';
            statusBtn.className = 'action-btn status-btn';
            statusBtn.onclick = () => updateOrderStatus(order.id);
            
            actionsCell.appendChild(detailsBtn);
            actionsCell.appendChild(statusBtn);
        });
    }
    
    function updateStats() {
        const cancelados = orders.filter(order => order.status === 'Cancelado');
        const concluidos = orders.filter(order => order.status === 'Concluído');
        
        const canceladosSum = cancelados.reduce((sum, order) => sum + order.total, 0);
        const concluidosSum = concluidos.reduce((sum, order) => sum + order.total, 0);
        const totalSum = orders.reduce((sum, order) => sum + order.total, 0);
        
        canceladosCount.textContent = cancelados.length;
        canceladosTotal.textContent = canceladosSum.toFixed(2).replace('.', ',');
        concluidosCount.textContent = concluidos.length;
        concluidosTotal.textContent = concluidosSum.toFixed(2).replace('.', ',');
        totalPedidos.textContent = orders.length;
        valorTotalGeral.textContent = totalSum.toFixed(2).replace('.', ',');
    }
    
    function showOrderDetails(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        document.getElementById('detailClient').textContent = order.clientName;
        document.getElementById('detailPhone').textContent = order.clientPhone;
        document.getElementById('detailAddress').textContent = order.clientAddress;
        document.getElementById('detailDate').textContent = order.orderDate;
        document.getElementById('detailPayment').textContent = order.paymentMethod;
        
        const statusElement = document.getElementById('detailStatus');
        statusElement.textContent = order.status;
        statusElement.className = `status-badge status-${order.status.toLowerCase()}`;
        
        document.getElementById('detailTotal').textContent = `R$ ${order.total.toFixed(2).replace('.', ',')}`;
        
        const productsList = document.getElementById('detailProducts');
        productsList.innerHTML = '';
        order.products.forEach(product => {
            const li = document.createElement('li');
            li.textContent = `${product.name} - R$ ${product.price.toFixed(2).replace('.', ',')}`;
            productsList.appendChild(li);
        });
        
        document.getElementById('detailNotes').textContent = order.orderNotes || "Nenhuma observação";
        
        // Configurar botão de edição (bloquear para cancelados)
        if (order.status === 'Cancelado') {
            editOrderBtn.disabled = true;
            editOrderBtn.textContent = ' Edição Bloqueada (Pedido Cancelado)';
            editOrderBtn.style.backgroundColor = '#cccccc';
            editOrderBtn.style.cursor = 'not-allowed';
        } else {
            editOrderBtn.disabled = false;
            editOrderBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Pedido';
            editOrderBtn.style.backgroundColor = '';
            editOrderBtn.style.cursor = '';
            
            editOrderBtn.onclick = function() {
                currentOrderId = order.id;
                fillOrderForm(order);
                orderDetailsModal.style.display = "none";
                orderFormModal.style.display = "block";
            };
        }
        
        // Configurar botão de impressão
        printOrderBtn.onclick = function() {
            preparePrintView(order);
            window.print();
        };
        
        orderDetailsModal.style.display = "block";
    }
    
    function fillOrderForm(order) {
        document.getElementById('clientName').value = order.clientName;
        document.getElementById('clientPhone').value = order.clientPhone;
        document.getElementById('clientAddress').value = order.clientAddress;
        document.getElementById('paymentMethod').value = order.paymentMethod;
        document.getElementById('orderNotes').value = order.orderNotes || '';
        document.getElementById('orderTotal').value = `R$ ${order.total.toFixed(2).replace('.', ',')}`;
        
        // Desmarcar todos os produtos primeiro
        productCheckboxes.forEach(checkbox => checkbox.checked = false);
        
        // Marcar os produtos do pedido
        order.products.forEach(product => {
            const productName = product.name.toLowerCase();
            for (const checkbox of productCheckboxes) {
                if (checkbox.dataset.name.toLowerCase() === productName) {
                    checkbox.checked = true;
                    break;
                }
            }
        });
    }
    
    function updateOrderStatus(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // Criar modal de status
        const statusModal = document.createElement('div');
        statusModal.className = 'modal';
        statusModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="status-header">
                    <h2>Atualizar Status do Pedido #${orderId}</h2>
                    <span class="close-btn">&times;</span>
                </div>
                
                <div class="status-options">
                    <label class="status-option status-pendente-bg ${order.status === 'Pendente' ? 'active' : ''}">
                        <input type="radio" name="status" value="Pendente" ${order.status === 'Pendente' ? 'checked' : ''}>
                        <span class="status-label">Pendente</span>
                    </label>
                    
                    <label class="status-option status-processando-bg ${order.status === 'Processando' ? 'active' : ''}">
                        <input type="radio" name="status" value="Processando" ${order.status === 'Processando' ? 'checked' : ''}>
                        <span class="status-label">Processando</span>
                    </label>
                    
                    <label class="status-option status-concluído-bg ${order.status === 'Concluído' ? 'active' : ''}">
                        <input type="radio" name="status" value="Concluído" ${order.status === 'Concluído' ? 'checked' : ''}>
                        <span class="status-label">Concluído</span>
                    </label>
                    
                    <label class="status-option status-cancelado-bg ${order.status === 'Cancelado' ? 'active' : ''}">
                        <input type="radio" name="status" value="Cancelado" ${order.status === 'Cancelado' ? 'checked' : ''}>
                        <span class="status-label">Cancelado</span>
                    </label>
                </div>
                
                <div id="cancelConfirm" class="cancel-confirmation" style="display: none;">
                    <p class="cancel-message">⚠️ Tem certeza que deseja cancelar este pedido?</p>
                    <div class="cancel-actions">
                        <button id="exitCancel" class="exit-cancel-btn">
                            <i class="fas fa-arrow-left"></i> Manter pedido
                        </button>
                        <button id="confirmCancel" class="confirm-cancel-btn">
                            <i class="fas fa-times"></i> Confirmar cancelamento
                        </button>
                    </div>
                </div>
                
                <button id="saveStatusBtn" class="submit-btn" style="margin-top: 1rem; width: 100%;">
                    <i class="fas fa-check"></i> Salvar Alterações
                </button>
            </div>
        `;

        document.body.appendChild(statusModal);
        statusModal.style.display = 'block';

        // Elementos do modal
        const closeBtn = statusModal.querySelector('.close-btn');
        const statusOptions = statusModal.querySelectorAll('.status-option');
        const cancelConfirm = statusModal.querySelector('#cancelConfirm');
        const saveBtn = statusModal.querySelector('#saveStatusBtn');
        const confirmCancelBtn = statusModal.querySelector('#confirmCancel');
        const exitCancelBtn = statusModal.querySelector('#exitCancel');

        // Fechar modal
        closeBtn.addEventListener('click', () => statusModal.remove());

        // Ao clicar em uma opção de status
        statusOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            
            option.addEventListener('click', () => {
                const selectedStatusLevel = statusHierarchy[radio.value];
                
                // Verificar se está tentando voltar para um status anterior (exceto cancelamento)
                if (selectedStatusLevel < statusHierarchy[order.status] && radio.value !== 'Cancelado') {
                    alert('Não é possível voltar o status do pedido para um estado anterior!');
                    return;
                }
                
                statusOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                radio.checked = true;
                
                if (radio.value === 'Cancelado') {
                    cancelConfirm.style.display = 'block';
                    saveBtn.style.display = 'none';
                } else {
                    cancelConfirm.style.display = 'none';
                    saveBtn.style.display = 'block';
                }
            });
        });

        // Confirmar cancelamento
        confirmCancelBtn.addEventListener('click', () => {
            order.status = 'Cancelado';
            renderOrdersTable();
            updateStats();
            statusModal.remove();
            alert(`Pedido #${orderId} foi cancelado.`);
        });

        // Sair do cancelamento
        exitCancelBtn.addEventListener('click', () => {
            statusOptions.forEach(option => {
                const radio = option.querySelector('input[type="radio"]');
                if (radio.value === order.status) {
                    radio.checked = true;
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
            cancelConfirm.style.display = 'none';
            saveBtn.style.display = 'block';
        });

        // Salvar outros status
        saveBtn.addEventListener('click', () => {
            const selectedStatus = statusModal.querySelector('input[name="status"]:checked').value;
            
            // Verificar se está tentando voltar para um status anterior
            const currentStatusLevel = statusHierarchy[order.status];
            const selectedStatusLevel = statusHierarchy[selectedStatus];
            
            if (selectedStatusLevel < currentStatusLevel && selectedStatus !== 'Cancelado') {
                alert('Não é possível voltar o status do pedido para um estado anterior!');
                return;
            }
            
            // Se for cancelamento, mostrar confirmação
            if (selectedStatus === 'Cancelado') {
                cancelConfirm.style.display = 'block';
                saveBtn.style.display = 'none';
                return;
            }
            
            order.status = selectedStatus;
            renderOrdersTable();
            updateStats();
            statusModal.remove();
            alert(`Status do pedido #${orderId} atualizado para: ${selectedStatus}`);
        });

        // Fechar ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target === statusModal) statusModal.remove();
        });
    }
    
    function preparePrintView(order) {
        let productsHTML = '';
        order.products.forEach(product => {
            productsHTML += `<li>${product.name} - R$ ${product.price.toFixed(2).replace('.', ',')}</li>`;
        });
        
        printableOrder.innerHTML = `
            <div class="print-container">
                <div class="print-header">
                    <h1>Comprovante de Pedido</h1>
                    <p>Número do Pedido: #${order.id}</p>
                    <p>Data: ${order.orderDate}</p>
                </div>
                
                <div class="print-details">
                    <div class="print-row">
                        <span class="print-label">Cliente:</span>
                        <span class="print-value">${order.clientName}</span>
                    </div>
                    <div class="print-row">
                        <span class="print-label">Telefone:</span>
                        <span class="print-value">${order.clientPhone}</span>
                    </div>
                    <div class="print-row">
                        <span class="print-label">Endereço:</span>
                        <span class="print-value">${order.clientAddress}</span>
                    </div>
                    <div class="print-row">
                        <span class="print-label">Forma de Pagamento:</span>
                        <span class="print-value">${order.paymentMethod}</span>
                    </div>
                    <div class="print-row">
                        <span class="print-label">Status:</span>
                        <span class="print-value status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                    <div class="print-row">
                        <span class="print-label">Total:</span>
                        <span class="print-value">R$ ${order.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="print-row">
                        <span class="print-label">Produtos:</span>
                        <ul class="print-value">${productsHTML}</ul>
                    </div>
                    <div class="print-row">
                        <span class="print-label">Observações:</span>
                        <span class="print-value">${order.orderNotes || "Nenhuma"}</span>
                    </div>
                </div>
                
                <div class="print-footer">
                    <p>Pedido gerado em ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `;
    }
    
    function exportToExcel() {
        const cancelados = orders.filter(order => order.status === 'Cancelado');
        const concluidos = orders.filter(order => order.status === 'Concluído');
        
        const canceladosSum = cancelados.reduce((sum, order) => sum + order.total, 0);
        const concluidosSum = concluidos.reduce((sum, order) => sum + order.total, 0);
        
        let csvContent = "Categoria,Quantidade,Valor Total\n";
        csvContent += `Cancelados,${cancelados.length},${canceladosSum.toFixed(2)}\n`;
        csvContent += `Concluídos,${concluidos.length},${concluidosSum.toFixed(2)}\n`;
        csvContent += `Total Geral,${orders.length},${(canceladosSum + concluidosSum).toFixed(2)}\n\n`;
        
        // Adicionar cabeçalho dos pedidos
        csvContent += "ID,Cliente,Data,Status,Total,Forma de Pagamento,Produtos\n";
        
        // Adicionar todos os pedidos
        orders.forEach(order => {
            const produtos = order.products.map(p => p.name).join('; ');
            csvContent += `${order.id},"${order.clientName}",${order.orderDate},${order.status},${order.total},"${order.paymentMethod}","${produtos}"\n`;
        });
        
        // Criar e baixar o arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", "pedidos_exportados.csv");
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function exportToPDF() {
        // Verifica se a biblioteca jsPDF está carregada
        if (typeof jsPDF === 'undefined') {
            alert('Biblioteca jsPDF não carregada. Por favor, tente novamente.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(18);
        doc.text("Relatório de Pedidos", 105, 15, null, null, 'center');
        
        // Estatísticas
        const cancelados = orders.filter(order => order.status === 'Cancelado');
        const concluidos = orders.filter(order => order.status === 'Concluído');
        const canceladosSum = cancelados.reduce((sum, order) => sum + order.total, 0);
        const concluidosSum = concluidos.reduce((sum, order) => sum + order.total, 0);
        const totalSum = orders.reduce((sum, order) => sum + order.total, 0);
        
        doc.setFontSize(12);
        doc.text(`Cancelados: ${cancelados.length} pedidos - R$ ${canceladosSum.toFixed(2)}`, 20, 25);
        doc.text(`Concluídos: ${concluidos.length} pedidos - R$ ${concluidosSum.toFixed(2)}`, 20, 32);
        doc.text(`Total Geral: ${orders.length} pedidos - R$ ${totalSum.toFixed(2)}`, 20, 39);
        
        // Tabela de pedidos
        const headers = [["ID", "Cliente", "Data", "Status", "Total", "Pagamento"]];
        
        const data = orders.map(order => [
            order.id,
            order.clientName.substring(0, 20), // Limita o nome para caber na célula
            order.orderDate,
            order.status,
            "R$ " + order.total.toFixed(2),
            order.paymentMethod
        ]);
        
        // Adiciona a tabela ao PDF
        doc.autoTable({
            head: headers,
            body: data,
            startY: 45,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { 
                fillColor: [52, 152, 219],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            didDrawPage: function (data) {
                // Rodapé em cada página
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(
                    `Relatório gerado em: ${new Date().toLocaleString()}`,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 10
                );
            }
        });
        
        // Salvar o PDF
        doc.save("relatorio_pedidos.pdf");
    }
}); // Fim do DOMContentLoaded
const airpayFields = [
    { key: "biller_code", label: "Biller Code" },
    { key: "long_name", label: "Biller Name" },
    { key: "amount", label: "Amount" },
    { key: "fee", label: "Fee" },
    { key: "real_amount", label: "Total Amount" },
    { key: "pay_time", label: "Payment Time" },
    { key: "pay_service_label", label: "Payment Service" },
    { key: "pay_status_display", label: "Status" }
];

const chinapayFields = [
    { key: "billerCode", label: "Biller Code" },
    { key: "orderDescription", label: "Biller Name" },
    { key: "orderAmount", label: "Amount" },
    { key: "surchargeAmount", label: "Fee" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "orderCreatedTime", label: "Payment Time" },
    { key: "fundingGateway", label: "Payment Service" },
    { key: "orderStatus", label: "Status" }
];

const sourceConfig = {
    airpay: {
        name: "AirPayFintech",
        file: "orders_airpayfintech.json",
        website: "https://h5-bpay.airpayfintech.com/bpay/orders",
        fields: airpayFields
    },
    chinapay: {
        name: "ChinaPayments",
        file: "orders_chinapayments.json",
        website: "https://www.chinapayments.com/customers/orders",
        fields: chinapayFields
    }
};

let currentData = [];
let currentFields = [];
let currentSource = "";
let sortState = { key: null, asc: true };

function formatValue(source, key, value) {
    if (value == null) return "";

    if (source === "chinapay") {
        if (["orderAmount", "surchargeAmount", "totalAmount"].includes(key)) {
            return (value / 100).toFixed(2);
        }
        if (key === "orderCreatedTime") {
            return value.split("T")[0];
        }
    }

    if (source === "airpay" && key === "pay_time") {
        return value.split("T")[0];
    }

    return value;
}

function renderTable(data, fields, source) {
    const thead = document.getElementById("tableHead");
    const tbody = document.getElementById("tableBody");

    thead.innerHTML = fields.map((f) => `<th data-key="${f.key}">${f.label}</th>`).join("");

    tbody.innerHTML = data
        .map((row, rowIndex) => {
            return (
                `<tr data-index="${rowIndex}">` +
                fields
                    .map((f) => {
                        const val = formatValue(source, f.key, row[f.key]) ?? "";
                        const numClass = !isNaN(val) && val !== "" ? "num" : "";
                        return `<td class="${numClass}">${val}</td>`;
                    })
                    .join("") +
                "</tr>"
            );
        })
        .join("");

    // 点击 header 排序
    thead.querySelectorAll("th").forEach((th) => {
        th.addEventListener("click", () => {
            const key = th.getAttribute("data-key");
            sortState.asc = sortState.key === key ? !sortState.asc : true;
            sortState.key = key;
            currentData.sort((a, b) => {
                let va = a[key],
                    vb = b[key];
                if (typeof va === "string") va = va.toLowerCase();
                if (typeof vb === "string") vb = vb.toLowerCase();
                if (va < vb) return sortState.asc ? -1 : 1;
                if (va > vb) return sortState.asc ? 1 : -1;
                return 0;
            });
            renderTable(currentData, currentFields, currentSource);
            document
                .querySelectorAll("th")
                .forEach((x) => x.classList.remove("sorted-asc", "sorted-desc"));
            th.classList.add(sortState.asc ? "sorted-asc" : "sorted-desc");
        });
    });

    // 点击行跳转详情页
    tbody.querySelectorAll("tr").forEach((tr) => {
        tr.addEventListener("click", () => {
            const idx = tr.getAttribute("data-index");
            window.location.href = `detail.html?source=${source}&index=${idx}`;
        });
    });
}

function loadData(source) {
    const cfg = sourceConfig[source];
    fetch(cfg.file)
        .then((resp) => resp.json())
        .then((data) => {
            currentData = data;
            currentFields = cfg.fields;
            currentSource = source;
            renderTable(currentData, currentFields, currentSource);

            // 更新按钮
            document.getElementById("btnSource").textContent = cfg.name;
            document.getElementById("btnWebsite").href = cfg.website;
        });
}

// 切换数据源
document.getElementById("btnSource").onclick = () => {
    const nextSource = currentSource === "airpay" ? "chinapay" : "airpay";
    loadData(nextSource);
};

// 默认显示 AirPay
loadData("airpay");

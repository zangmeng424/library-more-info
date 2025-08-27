// ==UserScript==
// @name         library-more-info
// @version      1.0
// @namespace    https://github.com/zangmeng424/library-more-info
// @description  图书馆预约系统更多信息展示
// @author       zangmeng
// @match        https://library-ic.sdws.edu.cn/*
// ==/UserScript==



var IntervalGrid = setInterval(bangGrid, 300)

function bangGrid() {
    const grid = document.querySelector('.grid')
    if (grid) {
        clearInterval(IntervalGrid)
        infoDiv()

        grid.addEventListener('mouseout', function (e) {
            if (e.relatedTarget.nodeName == "DIV" && e.relatedTarget._prevClass && e.relatedTarget._prevClass.includes("draggable")) {
                if (!e.relatedTarget.dataset.clickListenerAdded) {
                    e.relatedTarget.dataset.clickListenerAdded = "true"
                    e.relatedTarget.addEventListener("click", function () {
                        main(this.attributes[1].nodeValue)
                    })
                }
            }
        })

        // 增加按键 Q 触发功能
        let lastKeyTime = 0; // 防抖动
        document.addEventListener('keyup', function(e) {
            if (e.key.toLowerCase() === 'q') {
                const now = Date.now();
                if (now - lastKeyTime > 300) {
                    lastKeyTime = now;
                    const hoveredItem = document.querySelector('.grid .draggable:hover');
                    if (hoveredItem) {
                        main(hoveredItem.attributes[1].nodeValue);
                    } else {
                        console.warn('请将鼠标悬停在座位上再按 Q 键');
                    }
                }
            }
        });

    } else {
        console.warn('未找到 .grid 元素');
    }
}

function infoDiv() {
    // 创建 div 元素
    const infoBox = document.createElement('div')
    infoBox.innerHTML = `    <div style="
        position: fixed;
        bottom: 70px;
        right: 20px;
        width: 200px;
        text-align: center;
        box-shadow: 2px 2px 3px 3px rgba(75, 75, 75, 0.192);
        border-radius: 20px;
        background: white; /* 添加背景色避免透明 */
        z-index: 1000; /* 确保悬浮在最上层 */
    ">
    <h2 style="padding-top: 10px;">座位用户信息</h2>
    <div id="infoMain" style="padding-bottom:5px">

    </div>
</div>`

    // 插入到页面中
    document.body.appendChild(infoBox)
}

function main(deviceId) {
    const parts = window.location.href.split('/')
    const roomId = parts[parts.length - 1]
    const host = parts[2]
    const params = {
        roomIds: roomId,
        resvDates: document.querySelector(".el-input__inner").value.replaceAll("-", ""),
        sysKind: '8',
    }

    const queryString = new URLSearchParams(params).toString()
    const url = `https://${host}/ic-web/reserve?${queryString}`


    fetch(url)
        .then(response => response.json())
        .then(result => {
            let i = 0
            const infoMain = document.querySelector("#infoMain")
            infoMain.innerHTML = ""
            result.data.forEach(item => {
                if (deviceId == item.devName || item.devName.includes(deviceId) || deviceId.includes(item.devName)) {
                    //moreInfo[0 + i * 4].innerText = item.devName
                    if (Array.isArray(item.resvInfo) && item.resvInfo.length > 0) {
                        for (i = 0; i <= item.resvInfo.length; i++) {
                            console.log(item.resvInfo[i].resvId)
                            infoMain.innerHTML += `
                                <div style="
                                    padding: 2px;
                                    border: 1px solid rgb(163, 163, 163);
                                    margin: 5px 10px;
                                    width: 90%;
                                    text-align: left;
                                    " id="moreInfo">
                                        座位：<div style="font-weight: bold;"></div>
                                        预约人：<div style="font-weight: bold;"></div>
                                        预约人学号：<div style="font-weight: bold;"></div>
                                        预约时间：<div style="font-weight: bold;"></div>
                                        预约操作时间：<div style="font-weight: bold;"></div>
                                </div>
                                `
                            const moreInfo = document.querySelectorAll("#moreInfo div")
                            moreInfo[0 + i * 5].innerText = item.devName
                            const startTime = new Date(item.resvInfo[i].startTime)
                            const endTime = new Date(item.resvInfo[i].endTime)
                            moreInfo[3 + i * 5].innerText = startTime.toLocaleString('zh-CN') + "-" + endTime.toLocaleString('zh-CN')
                            const params = {
                                'resvId': item.resvInfo[i].resvId,
                                'pageNum': '1',
                                'pageSize': '20',
                                'orderKey': 'createTime',
                                'orderModel': 'desc',
                            }
                            const queryString = new URLSearchParams(params).toString()
                            const url = `https://${host}/ic-web/reserve/getSignRec?${queryString}`

                            fetch(url)
                                .then(response => response.json())
                                .then(data => {
                                    if (data.code === 0 && data.data.length > 0) {
                                        const moreInfo = document.querySelectorAll("#moreInfo div")
                                        const lastUserLogonName = data.data[data.data.length - 1].logonName
                                        const trueName = data.data[data.data.length - 1].trueName
                                        const createTime = data.data[data.data.length - 1].createTime
                                        console.log('最后一个用户的登录名:', lastUserLogonName)
                                        moreInfo[2 + (i - item.resvInfo.length) * 5].innerText = lastUserLogonName
                                        moreInfo[1 + (i - item.resvInfo.length) * 5].innerText = trueName
                                        moreInfo[4 + (i - item.resvInfo.length) * 5].innerText = new Date(createTime).toLocaleString('zh-CN')
                                        i += 1
                                    } else {
                                        console.log('没有数据或请求失败')
                                    }
                                })
                                .catch(error => console.error("请求失败:", error))

                        }
                    } else {
                        console.log("无记录");
                    }

                }


            });
        })
        .catch(error => console.error("请求失败:", error));
}


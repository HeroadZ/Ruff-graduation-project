/**
 * Created by Merlini on 2017/3/18.
 */
import $ from "jquery";

localStorage.setItem('ruffIp', '192.168.78.1');
localStorage.setItem('ruffUrl', 'http://' + localStorage.getItem('ruffIp') + ':6318/');

/**
 * 模式控制
 * @type {{InitMode}}
 */
let modeControl = {

    //初始化状态方法
    InitMode: () => {
        //获取DOM元素
        let threeToggles = [$('#responsiveModel'), $('#sleepModel'), $('#monitorModel')];

        /**
         * @param data.responsiveModelFlag
         * @param data.sleepToggleFlag
         * @param data.monitorToggleFlag
         */
        $.get(localStorage.getItem('ruffUrl') + 'modeStatus', (data, status) => {
            if (status === 'success') {
                for(let i=0;i<threeToggles.length;i++) {

                    //设置初始状态
                    threeToggles[i].prop('checked', data[threeToggles[i].attr('id') + 'Flag']);

                    //添加监听事件
                    threeToggles[i].click(function(){
                        $.get(localStorage.getItem('ruffUrl') + $(this).attr('id') + 'Toggle', (data, status) => {
                            if(status === 'success') {
                                $(this).prop('checked', data[$(this).attr('id') + 'Flag'])
                            }
                        });
                    });
                }
            }
        });
    }
};


let ipControl = {

    clickConfirm:() => {
        let ipInput = $('#ipInput'),
            ipSubmit = $('#ipSubmit');

        ipSubmit.click(function() {
            if(window.confirm('确认修改？')) {
                if(/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ipInput.val())) {
                    localStorage.setItem('ruffIp', ipInput.val());
                    localStorage.setItem('ruffUrl', 'http://' + localStorage.getItem('ruffIp') + ':6318/');
                    window.alert("修改成功！");
                } else {
                    window.alert('输入格式错误！');
                }
            }
        })
    }
};


modeControl.InitMode();
ipControl.clickConfirm();









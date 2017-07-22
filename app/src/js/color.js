/**
 * Created by Merlini on 2017/3/19.
 */
import $ from "jquery";

let colorControl = {
    colorInput: $('#colorInput'),
    colorArr: $('input[name="color"]'),

    inputFocus: () => {
        colorControl.colorInput.focus(function() {
            for(let i=0;i<colorControl.colorArr.length;i++) {
                colorControl.colorArr[i].checked = false;
            }
        })
    },

    radioChecked: () => {
        colorControl.colorArr.each(function() {
            $(this).click(function() {
                colorControl.colorInput.val('');
            })
        })
    },

    colorSubmit: () => {
        $('#colorSubmit').click(function() {
            let colorCode = '';

            if(confirm("确认修改吗？")) {

                // get colorCode
                if (colorControl.colorInput.val().length > 0) {
                    colorCode = '#' + colorControl.colorInput.val();
                } else {
                    for (let i = 0; i < colorControl.colorArr.length; i++) {
                        if (colorControl.colorArr[i].checked === true) {
                            colorCode = colorControl.colorArr[i].value;
                        }
                    }
                }

                console.log(colorCode);

                $.get(localStorage.getItem('ruffUrl') + 'colorChange?color=' + encodeURIComponent(colorCode), (data, status) => {
                    if(status === 'success') {
                        if(data.colorChange === true) {
                            window.alert("修改成功！");
                        } else {
                            window.alert("修改失败!");
                        }
                    } else {
                        window.alert("修改失败!");
                    }
                });

            }
        });
    }
};

colorControl.inputFocus();
colorControl.colorSubmit();
colorControl.radioChecked();
import Vue from 'vue'

function overdue(date) {//判断问卷是否过期
    var queDate = date.split('-');
    for (var i = 0; i < queDate.length; i++) {
        queDate[i] = Number(queDate[i])
    }
    var nowDate = new Date();
    var year = nowDate.getFullYear();
    var month = nowDate.getMonth() + 1;
    var day = nowDate.getDate();
    var now = year * 10000 + month * 100 + day;
    var que = queDate[0] * 10000 + queDate[1] * 100 + queDate[2];
    return que < now
}

export default {
    getName({ state }) {//得到用户的用户名
        Vue.http.options.root = '.';
        return Vue.http.get('./data.php').then(response => {
            state.name = response.body;
        }, response => {
            alert("error" + response.headers)
        });
    },
    getList({ state, dispatch }) {//得到问卷列表
        return Vue.http.post('./data.php', { "type": "list" })
            .then(response => {
                var flag = [];
                if (response.body != 0) {
                    if (response.body.indexOf("++") !== -1) {
                        state.list = response.body.split('++');
                    }
                    else {
                        state.list[0] = response.body;
                    }
                    for (var i = 0; i < state.list.length; i++) {
                        state.list[i] = JSON.parse(state.list[i]);
                        if (overdue(state.list[i].date)) {
                            state.list[i].date = '已过期';
                            flag.push(i);
                        }
                    }
                }
                else {
                    state.list = []
                }
                if (flag) {
                    dispatch('save', { type: '已过期' })
                }

            }, response => {
                alert("error" + response.headers)
            });
    },
    save({ state, commit }, arr) {//保存问卷
        if (arr.type == '已过期') {
            return Vue.http.post('./data.php', { "type": "saveList", "data": state.list })
                .then(response => {
                    console.log('成功保存问卷列表');
                }, response => {
                    alert("error" + response.headers)
                })
        }
        else {
            state.questionnaire.status = arr.type;
            if (arr.index != undefined) {
                return Vue.http.post('./data.php', { "type": "mod", "index": arr.index, "data": state.questionnaire })
                    .then(response => {
                        console.log('修改问卷成功并保存，问卷状态为' + arr.type);
                        commit('switchEditing', { boolean: false });
                    }, response => {
                        alert("error" + response.headers)
                    });
            }
            else {
                return Vue.http.post('./data.php', { "type": "add", "data": state.questionnaire })
                    .then(response => {
                        console.log('增加问卷成功并保存，问卷状态为' + arr.type);
                    }, response => {
                        alert("error" + response.headers)
                    });
            }
        }
    },
    reset({ state }, arr) {//重置正在编辑的问卷
        if (arr) {
            return Vue.http.post('./data.php', { "type": "get", "index": arr.index })
                .then(response => {
                    state.questionnaire = JSON.parse(response.body);
                    console.log('成功重置正在编辑的问卷');
                }, response => {
                    alert("error" + response.headers)
                });
        }
        else {
            state.questionnaire = { title: '请输入标题', questions: [{ type: 'radio', title: '请输入标题', required: false, options: ['选项', '选项'] }], date: '2017-1-1', status: '未保存' }
        }
    },
    removeNaire({ state }, arr) {//删除问卷
        state.list.splice(arr.index, 1)
        return Vue.http.post('./data.php', { "type": "del", "index": arr.index })
            .then(response => {
                console.log('成功删除第' + (arr.index + 1) + '号问卷');
            }, response => {
                alert("error" + response.headers)
            });
    }
}
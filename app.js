new Vue({
  el: '#app',
  data: function() {
    return {
      // 模拟后端返回的平台数据
      platformData: {
        logo: 'https://minimax-algeng-chat-tts.oss-cn-wulanchabu.aliyuncs.com/ccv2%2F2026-04-27%2FMiniMax-M2.7-highspeed%2F2044426698631418498%2F76dc2929ba40e98222e87208542fcf683ad282ef237be383c0541a12dd78b17e..png?Expires=1777374877&OSSAccessKeyId=LTAI5tGLnRTkBjLuYPjNcKQ8&Signature=LvlYUgdywvec7HeU5zAtaRlNGj4%3D',
        name: 'AppsFlyer',
        type: '广告归因平台'
      },

      // 平台选项
      platformOptions: [
        { label: 'ANDROID', value: 'ANDROID' },
        { label: 'HarmonyOs', value: 'HARMONYS' },
        { label: 'IOS', value: 'IOS' },
        { label: 'WEB', value: 'WEB' },
        { label: 'WechatGame', value: 'WECHATGAME' },
        { label: 'WINDOWS', value: 'WINDOWS' }
      ],

      // 模拟近7日数据投递状态
      deliveryStatus: {
        pushHasData: false,
        pullHasData: false
      },

      // 平台配置列表（核心：一套配置，AppID + 事件名 + 状态）
      platformConfigs: [],

      // Push API 配置
      pushConfig: {
        enabled: false,
        receiveUrl: 'https://api.example.com/appsflyer/push/receive'
      },

      // Pull API 配置
      pullConfig: {
        enabled: false,
        apiToken: '',
        apiTokenError: ''
      },

      // 弹窗
      showDialog: false,
      showDropdown: false,
      selectedPlatform: ''
    };
  },

  computed: {
    // 计算接入状态
    accessStatus: function() {
      var pushEnabled = this.pushConfig.enabled;
      var pullEnabled = this.pullConfig.enabled;

      var hasValidConfig = this.platformConfigs.some(function(p) {
        return p.status && p.appids && p.appids.length > 0 && p.eventName;
      });

      var hasReceiverEnabled = pushEnabled || pullEnabled;

      if (!hasReceiverEnabled) {
        if (!hasValidConfig) {
          return { text: '待配置', class: 'waiting', icon: '⏳' };
        } else {
          return { text: '已关闭', class: 'closed', icon: '⭮' };
        }
      } else {
        var pushHasData = this.deliveryStatus.pushHasData;
        var pullHasData = this.deliveryStatus.pullHasData;

        if (pushEnabled && pullEnabled) {
          if (!pushHasData && !pullHasData) {
            return { text: '已接入，近7日内无数据投递', class: 'warning', icon: '⚠️' };
          } else if (!pushHasData) {
            return { text: '已接入，近7日内Push API无数据投递', class: 'warning', icon: '⚠️' };
          } else if (!pullHasData) {
            return { text: '已接入，近7日内Pull API无数据投递', class: 'warning', icon: '⚠️' };
          } else {
            return { text: '已接入', class: 'active', icon: '✓' };
          }
        } else if (pushEnabled) {
          if (!pushHasData) {
            return { text: '已接入，近7日内Push API无数据投递', class: 'warning', icon: '⚠️' };
          }
          return { text: '已接入', class: 'active', icon: '✓' };
        } else {
          if (!pullHasData) {
            return { text: '已接入，近7日内Pull API无数据投递', class: 'warning', icon: '⚠️' };
          }
          return { text: '已接入', class: 'active', icon: '✓' };
        }
      }
    },

    // 可选平台
    availablePlatforms: function() {
      var used = this.platformConfigs.map(function(p) { return p.code; });
      var self = this;
      return this.platformOptions.map(function(opt) {
        return {
          label: opt.label,
          value: opt.value,
          used: used.indexOf(opt.value) !== -1
        };
      });
    }
  },

  methods: {
    // 打开添加平台弹窗
    openAddPlatformDialog: function() {
      this.showDialog = true;
      this.$nextTick(function() {
        var dialog = document.getElementById('nativeDialog');
        if (dialog) dialog.showModal();
      });
    },

    // 初始化
    init: function() {
      var self = this;
      if (this.platformConfigs.length === 0) {
        ['ANDROID', 'IOS'].forEach(function(code) {
          var opt = self.platformOptions.find(function(o) { return o.value === code; });
          self.platformConfigs.push({
            code: code,
            name: opt.label,
            appids: [],
            eventName: 'af_complete_registration',
            appidError: '',
            _appidInput: ''
          });
        });
      }
    },

    // 添加平台
    addPlatform: function(value) {
      var opt = this.platformOptions.find(function(o) { return o.value === value; });
      if (opt && !this.platformConfigs.some(function(p) { return p.code === opt.value; })) {
        this.platformConfigs.push({
          code: opt.value,
          name: opt.label,
          appids: [],
          eventName: 'af_complete_registration',
          appidError: '',
          _appidInput: ''
        });
      }
      this.showDropdown = false;
      this.closeDialog();
    },

    // 关闭弹窗
    closeDialog: function() {
      this.showDialog = false;
      var dialog = document.getElementById('nativeDialog');
      if (dialog) dialog.close();
    },

    // 删除平台
    removePlatform: function(index) {
      if (this.platformConfigs.length <= 1) {
        this.$message.warning('至少保留一个平台配置');
        return;
      }
      this.platformConfigs.splice(index, 1);
    },

    // 添加 AppID
    addAppId: function(platform) {
      var val = (platform._appidInput || '').trim();
      if (!val) return;

      // 格式校验
      if (platform.code === 'ANDROID') {
        if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(val)) {
          this.$message.warning('Android AppID 格式错误，应为 com.xxx.xxx 格式');
          return;
        }
      } else if (platform.code === 'IOS') {
        if (!/^id\d+$/.test(val)) {
          this.$message.warning('iOS AppID 格式错误，应为 id数字 格式');
          return;
        }
      }

      if (platform.appids.indexOf(val) !== -1) {
        this.$message.warning('AppID 不能重复');
        return;
      }
      platform.appids.push(val);
      platform.appidError = '';
      platform._appidInput = '';
    },

    // 删除 AppID
    removeAppId: function(platform, index) {
      platform.appids.splice(index, 1);
    },

    // 复制地址
    copyUrl: function() {
      var self = this;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(this.pushConfig.receiveUrl).then(function() {
          self.$message.success('复制成功');
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = self.pushConfig.receiveUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        self.$message.success('复制成功');
      }
    },

    // 校验
    validate: function() {
      var valid = true;

      // 平台配置
      var hasValid = false;
      this.platformConfigs.forEach(function(p) {
        p.appidError = '';
        if (p.appids.length === 0) {
          p.appidError = 'AppID 不能为空';
          valid = false;
        }
        if (!p.eventName) {
          valid = false;
        }
        if (p.appids.length > 0) hasValid = true;
      });
      if (!hasValid) valid = false;

      // Pull API
      if (this.pullConfig.enabled && !this.pullConfig.apiToken) {
        this.pullConfig.apiTokenError = 'API Token 为必填项';
        valid = false;
      }

      // 至少开启一个
      if (!this.pushConfig.enabled && !this.pullConfig.enabled) {
        this.$message.warning('请至少开启一个 API 数据接收配置');
        valid = false;
      }

      return valid;
    },

    // 提交
    submitConfig: function() {
      if (!this.validate()) return;
      var payload = {
        platforms: this.platformConfigs.filter(function(p) {
          return p.appids.length > 0;
        }).map(function(p) {
          return {
            platform_code: p.code,
            platform_name: p.name,
            app_ids: p.appids,
            event_name: p.eventName
          };
        }),
        push_api: { enabled: this.pushConfig.enabled },
        pull_api: { enabled: this.pullConfig.enabled, api_token: this.pullConfig.apiToken }
      };
      console.log('提交数据:', JSON.stringify(payload, null, 2));
      this.$message.success('操作成功');
    },

    // 返回
    goBack: function() {
      this.$message.info('返回列表页');
    }
  },

  mounted: function() {
    this.init();
    window.vueApp = this;
    var self = this;
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.add-platform-row')) {
        self.showDropdown = false;
      }
    });
  }
});
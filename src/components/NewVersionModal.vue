<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content cool-modal">
      <!-- Tech corners -->
      <div class="tech-corner top-left"></div>
      <div class="tech-corner top-right"></div>
      <div class="tech-corner bottom-left"></div>
      <div class="tech-corner bottom-right"></div>

      <div class="modal-body">
        <button @click="close" class="close-button">
            <i class="icon icon-close"></i>
        </button>

        <div class="title_holder">
          <h3>新版本已发布</h3>
          <div class="cyber-line"></div>
        </div>

        <div class="message-content">
          <p>感谢您一如既往的支持！</p>
          <p>OSK BANK已在BNB链上发布。</p>
          <p>您可点击访问，或复制网站地址。</p>
        </div>

        <!-- Action Buttons -->
        <div class="button-group">
          <a href="https://bsc.oskbank.com/" target="_blank" class="action-btn confirm-btn visit-btn">
            <span>访问新网站</span>
            <span class="arrow-icon">→</span>
          </a>
          
          <button @click="copyLink" class="action-btn confirm-btn copy-wrapper">
            <span class="url-text">bsc.oskbank.com</span>
            <span class="copy-icon">
                <i class="icon icon-copy"></i> 复制
            </span>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { showToast } from '@/services/notification';
import { t } from '@/i18n';

export default {
  name: 'NewVersionModal',
  methods: {
    close() {
      this.$emit('close');
    },
    copyLink() {
      const url = 'https://bsc.oskbank.com/';
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(t('toast.copySuccess') || '复制成功');
      } catch (err) {
        console.error('无法复制链接: ', err);
        showToast(t('toast.copyFailed') || '复制失败');
      }
    }
  }
};
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* Highest priority */
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 400px;
  padding: 32px;
  background: rgba(20, 20, 20, 0.95);
  border: 2px solid var(--border-light);
  /* Hand-drawn Box */
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  overflow: visible;
  
  /* Scientific Diagram Corner Marks */
  &::after {
      content: '';
      position: absolute;
      top: 10px; left: 10px; right: 10px; bottom: 10px;
      border: 1px dashed var(--text-muted);
      border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
      pointer-events: none;
      opacity: 0.3;
  }
}

.tech-corner { display: none; }

.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;

  &:hover {
    color: var(--primary-gold);
    transform: scale(1.1) rotate(90deg);
  }
}

.title_holder {
  text-align: center;
  margin-bottom: 24px;

  h3 {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    margin-bottom: 12px;
    color: #fff;
    font-weight: 400;
    letter-spacing: 1px;
    text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
  }
  
  /* Chalk Underline */
  .cyber-line {
      width: 60px;
      height: 2px;
      background: var(--primary-gold);
      margin: 0 auto;
      /* Scribble effect */
      border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
      transform: rotate(-1deg);
      box-shadow: none;
  }
}

.message-content {
  text-align: center;
  color: var(--text-primary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 32px;
  font-family: var(--font-body);
  word-break: break-word;
  
  p {
      margin: 5px 0;
  }
}

.button-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.action-btn {
    padding: 12px 20px;
    /* Hand drawn pill */
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--font-body);
    width: 100%;
    max-width: 320px;
    text-decoration: none; /* For <a> tag */
    
    &.confirm-btn {
        background: transparent;
        border: 2px solid var(--primary-gold);
        color: var(--primary-gold);
        
        &:hover {
            background: rgba(212, 175, 55, 0.1);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
            transform: rotate(1deg);
        }
    }

    /* Style for Visit Button to center text and arrow */
    &.visit-btn {
        justify-content: space-between;
        gap: 10px;
        background: rgba(212, 175, 55, 0.1); /* Slight background to distinguish */
        
        &:hover {
             background: rgba(212, 175, 55, 0.2);
        }
        
        .arrow-icon {
            font-size: 1.2rem;
            line-height: 1;
            transition: transform 0.3s ease;
        }
        
        &:hover .arrow-icon {
            transform: translateX(5px);
        }
    }

    .url-text {
        font-family: var(--font-mono);
        font-size: 0.9rem;
        margin-right: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .copy-icon {
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.95rem;
    }
}
</style>

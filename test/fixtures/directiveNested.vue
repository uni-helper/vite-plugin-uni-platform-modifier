<template>
  <view @click.h5="onH5Click" @click="onDefaultClick">
    <text v-text.h5.mp-weixin="'platform'" v-text="'default'" />
    <button :disabled.mp-weixin="true" :disabled="false">
      <text class.h5="h5-class" class="default-class">label</text>
    </button>
  </view>
</template>

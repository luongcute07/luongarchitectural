<template>
  <div v-if="open" class="modal fade show d-block" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ editing ? (editing.id ? "Sửa tin" : "Tạo tin mới") : "Xem tin" }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div v-if="editing">
            <div class="mb-2">
              <label class="form-label">Tiêu đề</label>
              <input v-model="localData.title" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Danh mục</label>
              <select v-model="localData.category" class="form-select">
                <option v-for="c in categories" :key="c">{{ c }}</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">Mô tả ngắn</label>
              <input v-model="localData.short_desc" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Nội dung</label>
              <textarea v-model="localData.content" rows="6" class="form-control"></textarea>
            </div>
          </div>

          <div v-else>
            <h5>{{ viewData.title }}</h5>
            <div class="text-muted small mb-2">
              {{ viewData.category }} • {{ formatDate(viewData.published_at) }} • bởi {{ viewData.author }}
            </div>
            <p>{{ viewData.content }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="editing" class="btn btn-secondary" @click="$emit('close')">Hủy</button>
          <button v-if="editing" class="btn btn-primary" @click="save">Lưu</button>
          <button v-if="!editing" class="btn btn-secondary" @click="$emit('close')">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue"

const props = defineProps({
  open: Boolean,
  editing: Object,
  viewData: Object,
  categories: Array
})
const emit = defineEmits(["close","save"])

const localData = ref({})

watch(() => props.editing, (val) => {
  if(val) localData.value = { ...val }
}, {immediate: true})

function save(){
  emit("save", localData.value)
}
function formatDate(d){ return new Date(d).toLocaleString() }
</script>
 
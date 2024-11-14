.PHONY: clean

# 1. 把 --target=wasm32 替换成 --target=wasm32-unknown-wasi
# 2. 添加 wasi-libc 的搜索路径, 并且要去掉 --no-standard-libraries 选项
# 3. 添加内存管理函数的导出 -Wl,--export=malloc,--export=free
c.wasm: main.c
	clang \
	-v \
	--target=wasm32-unknown-wasi \
	--sysroot=/tmp/wasi-libc \
	-nostartfiles \
	-Wl,--no-entry \
	-Wl,--unresolved-symbols=ignore-all \
	-Wl,--import-undefined \
	-Wl,--export=test,--export=from_js_to_c_struct,--export=from_js_to_c_string,--export=from_js_to_c_enum,--export=from_js_to_c_union,--export=from_c_to_js_return_struct,--export=sum_for_struct,--export=from_c_to_js_return_string,--export=from_c_to_js_return_union,--export=from_c_to_js_return_function_ptr,--export=from_js_to_c_array,--export=from_js_to_c_function_ptr,--export=callback_to_set \
	-Wl,--export=callback,--export=callback2 \
	-Wl,--import-table \
	-Wl,--export=malloc,--export=free \
	-o $@ $^

clean:
	rm -rf c.wasm

<script lang="ts">
	import type { WorkerInput, WorkerOutput } from '@src/tasks/banner';
	import BannerTask from '@src/tasks/banner?worker';
	import type { SvelteEvent } from '@src/types';
	import { onMount } from 'svelte';
	import { v4 as uuid } from 'uuid';
	import { filesize } from 'filesize';
	import FaAdobe from 'svelte-icons/fa/FaAdobe.svelte';
	import FaGoogle from 'svelte-icons/fa/FaGoogle.svelte';
	import IoIosCloudUpload from 'svelte-icons/io/IoIosCloudUpload.svelte';
	import IoIosLink from 'svelte-icons/io/IoIosLink.svelte';
	import Spinner from '@src/components/Spinner.svelte';

	const ALLOWED_MIME = [
		'application/x-zip-compressed',
		'application/zip',
		'multipart/x-zip',
		'application/vnd.rar',
		'application/x-rar-compressed'
	];

	interface Banner extends WorkerOutput {
		name: string;
		size: string;
		loading: boolean;
	}

	const inputId = uuid();

	let worker: Worker;
	let banners: Banner[] = [];
	let isDraging = false;

	function processFiles(files: File[]) {
		for (const file of files) {
			const id = uuid();
			banners = [
				{
					id,
					type: 'other',
					name: file.name,
					url: '',
					size: filesize(file.size, { base: 2, standard: 'jedec' }) as string,
					loading: true
				},
				...banners
			];
			startWorker({
				id,
				file
			});
		}
	}

	function onChange(e: SvelteEvent<Event, HTMLInputElement>) {
		if (e.currentTarget.files) {
			const files = [...e.currentTarget.files].filter((f) => ALLOWED_MIME.includes(f.type));
			processFiles(files);
		}
	}

	function onWorkerSuccess(data: WorkerOutput) {
		banners = banners.map((banner) => {
			if (banner.id == data.id) {
				return {
					...banner,
					loading: false,
					url: data.url,
					type: data.type
				};
			}

			return banner;
		});
	}

	function onDrop(e: SvelteEvent<DragEvent, HTMLFormElement>) {
		stopDrag(e);
		if (e.dataTransfer?.files) {
			const files = [...e.dataTransfer.files].filter((f) => ALLOWED_MIME.includes(f.type));
			processFiles(files);
		}
	}

	function startWorker(data: WorkerInput) {
		worker.postMessage(data);
	}

	function prevent(e: SvelteEvent<Event, HTMLFormElement>) {
		e.preventDefault();
		e.stopPropagation();
	}

	function startDrag(e: SvelteEvent<Event, HTMLFormElement>) {
		prevent(e);
		isDraging = true;
	}

	function stopDrag(e: SvelteEvent<Event, HTMLFormElement>) {
		prevent(e);
		isDraging = false;
	}

	onMount(() => {
		worker = new BannerTask();
		worker.onmessage = (e) => onWorkerSuccess(e.data);
	});
</script>

<div class="min-h-screen flex flex-col items-center bg-gray-100 pb-40">
	<h1 class="text-6xl my-40">Banner Viewer</h1>
	<div class="bg-white rounded-md p-5 w-full max-w-xl border border-gray-200">
		<form
			class="w-full h-60 border-2 flex flex-col items-center justify-center rounded-md gap-5 border-dashed"
			class:draging={isDraging}
			on:drag={prevent}
			on:dragstart={prevent}
			on:dragover={startDrag}
			on:dragenter={startDrag}
			on:dragend={stopDrag}
			on:dragleave={stopDrag}
			on:drop={onDrop}
		>
			<div class="w-10 h-10 text-gray-400">
				<!-- <HiArrowUpTrayOutline /> -->
				<IoIosCloudUpload />
			</div>
			<div>
				Drag & Drop or <span>
					<label for={inputId} class="text-blue-700 hover:underline cursor-pointer"
						>Choose file</label
					>
					<input
						on:change={onChange}
						type="file"
						multiple
						id={inputId}
						accept=".zip,.rar"
						class="invisible w-0 h-0"
					/>
				</span> to upload
			</div>
			<div class="text-sm text-gray-400">ZIP, RAR</div>
		</form>

		{#if banners.length}
			<div class="flex flex-col gap-3 mt-5">
				{#each banners as banner}
					<a
						href={banner.url}
						target="_blank"
						rel="noreferrer"
						class="relative bg-gray-100 p-3 rounded flex items-center gap-3 hover:bg-gray-200"
						class:loading={banner.loading}
					>
						{#if banner.loading}
							<div class="absolute inset-0 bg-white opacity-30 flex items-center justify-center">
								<Spinner />
							</div>
						{/if}
						<div class="px-1">
							<div class="w-8 h-8 text-gray-600">
								{#if banner.type == 'adobe'}
									<FaAdobe />
								{/if}
								{#if banner.type == 'gwd'}
									<FaGoogle />
								{/if}
							</div>
						</div>
						<div class="flex-1 flex flex-col">
							<div class="font-normal">{banner.name}</div>
							<div class="text-xs text-gray-500">{banner.size}</div>
						</div>
						<div class="w-7 h-7">
							<IoIosLink />
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.draging {
		@apply border-blue-600 border-solid bg-blue-100;
	}
	.loading {
		@apply pointer-events-none;
	}
</style>

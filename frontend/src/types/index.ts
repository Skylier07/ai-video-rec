export interface VideoSegment {
  video_id: string;
  title: string;
  start_time: number;
  end_time: number;
  explanation: string;
}

export interface VideoMeta {
  video_id: string;
  title: string;
}

export interface StudySnapInput {
  imageBase64: string | null;
  imageMimeType: string | null;
  text: string | null;
}

export interface StudySnapResults {
  question: string;
  concepts: string[];
  segments: VideoSegment[];
  videos: VideoMeta[];
}
